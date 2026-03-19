defmodule Backend.Content.Loader do
  @moduledoc """
  Loads course and lesson content from the filesystem.

  Content is organized as:
    content/
      <subject>/
        course.yaml
        <module-dir>/
          01-lesson.md
          02-lesson.md
  """

  alias Backend.Content.{Course, Lesson}

  @doc "Returns the configured content directory path."
  def content_dir do
    Application.get_env(:backend, :content_dir, default_content_dir())
  end

  defp default_content_dir do
    Path.expand("../../../content", __DIR__)
  end

  @doc "Scans the content directory and returns a list of subjects with their courses."
  def load_all_subjects do
    base = content_dir()

    case File.ls(base) do
      {:ok, entries} ->
        subjects =
          entries
          |> Enum.filter(fn entry ->
            File.dir?(Path.join(base, entry)) and
              File.exists?(Path.join([base, entry, "course.yaml"]))
          end)
          |> Enum.sort()
          |> Enum.map(fn subject_dir ->
            case load_course_yaml(Path.join([base, subject_dir, "course.yaml"])) do
              {:ok, course} ->
                %{
                  subject: subject_dir,
                  courses: [
                    %{
                      id: course.id,
                      title: course.title,
                      description: course.description,
                      language: course.language
                    }
                  ]
                }

              _ ->
                nil
            end
          end)
          |> Enum.reject(&is_nil/1)

        {:ok, subjects}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc "Loads a specific course by its ID, including module and lesson summaries."
  def load_course(course_id) do
    base = content_dir()

    case find_course_dir(base, course_id) do
      {:ok, course_dir} ->
        course_yaml_path = Path.join(course_dir, "course.yaml")

        with {:ok, course} <- load_course_yaml(course_yaml_path) do
          modules = load_modules(course_dir, course.modules)
          {:ok, %{course | modules: modules}}
        end

      :error ->
        {:error, :not_found}
    end
  end

  @doc "Loads a specific lesson by its ID."
  def load_lesson(lesson_id) do
    base = content_dir()

    case find_lesson_file(base, lesson_id) do
      {:ok, file_path} ->
        parse_lesson_file(file_path)

      :error ->
        {:error, :not_found}
    end
  end

  # --- Private helpers ---

  defp find_course_dir(base, course_id) do
    case File.ls(base) do
      {:ok, entries} ->
        result =
          Enum.find(entries, fn entry ->
            course_yaml = Path.join([base, entry, "course.yaml"])

            if File.exists?(course_yaml) do
              case YamlElixir.read_from_file(course_yaml) do
                {:ok, %{"id" => ^course_id}} -> true
                _ -> false
              end
            else
              false
            end
          end)

        if result, do: {:ok, Path.join(base, result)}, else: :error

      _ ->
        :error
    end
  end

  defp find_lesson_file(base, lesson_id) do
    case File.ls(base) do
      {:ok, subjects} ->
        result =
          Enum.find_value(subjects, fn subject ->
            subject_path = Path.join(base, subject)

            if File.dir?(subject_path) do
              find_lesson_in_subject(subject_path, lesson_id)
            end
          end)

        if result, do: {:ok, result}, else: :error

      _ ->
        :error
    end
  end

  defp find_lesson_in_subject(subject_path, lesson_id) do
    case File.ls(subject_path) do
      {:ok, entries} ->
        Enum.find_value(entries, fn entry ->
          mod_path = Path.join(subject_path, entry)

          if File.dir?(mod_path) and entry != "." and entry != ".." do
            find_lesson_in_module(mod_path, lesson_id)
          end
        end)

      _ ->
        nil
    end
  end

  defp find_lesson_in_module(mod_path, lesson_id) do
    case File.ls(mod_path) do
      {:ok, files} ->
        Enum.find_value(files, fn file ->
          if String.ends_with?(file, ".md") do
            file_path = Path.join(mod_path, file)

            case parse_frontmatter(File.read!(file_path)) do
              {:ok, meta, _body} ->
                if Map.get(meta, "id") == lesson_id, do: file_path

              _ ->
                nil
            end
          end
        end)

      _ ->
        nil
    end
  end

  defp load_course_yaml(path) do
    case YamlElixir.read_from_file(path) do
      {:ok, data} ->
        modules =
          (data["modules"] || [])
          |> Enum.map(fn m ->
            %Course.Module{
              id: m["id"],
              title: m["title"],
              sequence: m["sequence"]
            }
          end)

        course = %Course{
          id: data["id"],
          subject: data["subject"],
          title: data["title"],
          description: data["description"],
          language: data["language"],
          modules: modules
        }

        {:ok, course}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp load_modules(course_dir, module_defs) do
    module_defs
    |> Enum.sort_by(& &1.sequence)
    |> Enum.map(fn mod_def ->
      mod_path = Path.join(course_dir, mod_def.id)

      lessons =
        if File.dir?(mod_path) do
          load_lesson_summaries(mod_path)
        else
          []
        end

      %Course.Module{
        id: mod_def.id,
        title: mod_def.title,
        sequence: mod_def.sequence,
        lessons: lessons
      }
    end)
  end

  defp load_lesson_summaries(mod_path) do
    case File.ls(mod_path) do
      {:ok, files} ->
        files
        |> Enum.filter(&String.ends_with?(&1, ".md"))
        |> Enum.sort()
        |> Enum.map(fn file ->
          file_path = Path.join(mod_path, file)
          content = File.read!(file_path)

          case parse_frontmatter(content) do
            {:ok, meta, _body} ->
              %Course.LessonSummary{
                id: meta["id"],
                title: meta["title"],
                sequence: meta["sequence"],
                difficulty: meta["difficulty"],
                estimated_minutes: meta["estimated_minutes"],
                activity_types: meta["activity_types"] || []
              }

            _ ->
              nil
          end
        end)
        |> Enum.reject(&is_nil/1)
        |> Enum.sort_by(& &1.sequence)

      _ ->
        []
    end
  end

  defp parse_lesson_file(file_path) do
    content = File.read!(file_path)

    case parse_frontmatter(content) do
      {:ok, meta, body} ->
        sections = parse_sections(body)

        lesson = %Lesson{
          id: meta["id"],
          module: meta["module"],
          sequence: meta["sequence"],
          title: meta["title"],
          difficulty: meta["difficulty"],
          estimated_minutes: meta["estimated_minutes"],
          activity_types: meta["activity_types"] || [],
          slide_content: Map.get(sections, "Slide"),
          discussion_prompt: Map.get(sections, "Discussion"),
          quiz_content: Map.get(sections, "Quiz"),
          playground_code: Map.get(sections, "Playground"),
          playground_solution: Map.get(sections, "Solution")
        }

        {:ok, lesson}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp parse_frontmatter(content) do
    case String.split(content, "---", parts: 3) do
      [_, yaml_str, body] ->
        case YamlElixir.read_from_string(yaml_str) do
          {:ok, meta} ->
            {:ok, meta, String.trim(body)}

          {:error, reason} ->
            {:error, reason}
        end

      _ ->
        {:error, :invalid_frontmatter}
    end
  end

  defp parse_sections(body) do
    # Split by ## headers, keeping the header name
    parts = Regex.split(~r/^## /m, body, include_captures: false)

    # First element is any content before the first ## (usually empty), skip it
    parts
    |> Enum.drop(1)
    |> Enum.reduce(%{}, fn part, acc ->
      case String.split(part, "\n", parts: 2) do
        [header | rest] ->
          section_name = String.trim(header)
          section_content = rest |> Enum.join("\n") |> String.trim()
          Map.put(acc, section_name, section_content)

        _ ->
          acc
      end
    end)
  end
end
