import { Socket, Channel } from 'phoenix';

const SOCKET_URL = '/socket';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = new Socket(SOCKET_URL, {});
    socket.connect();
  }
  return socket;
}

export function joinClassroom(
  sessionId: string,
  callbacks: {
    onAgentMessage: (msg: any) => void;
    onAgentChunk: (chunk: any) => void;
    onAgentDone: (data: any) => void;
    onCurriculumProgress?: (data: any) => void;
    onAdvancePrompt?: (data: any) => void;
    onQuizResult?: (data: any) => void;
  }
): Channel {
  const s = getSocket();
  const channel = s.channel(`classroom:${sessionId}`, {});

  channel.on('agent_message', callbacks.onAgentMessage);
  channel.on('agent_chunk', callbacks.onAgentChunk);
  channel.on('agent_done', callbacks.onAgentDone);
  if (callbacks.onCurriculumProgress) {
    channel.on('curriculum_progress', callbacks.onCurriculumProgress);
  }
  if (callbacks.onAdvancePrompt) {
    channel.on('advance_prompt', callbacks.onAdvancePrompt);
  }
  if (callbacks.onQuizResult) {
    channel.on('quiz_result', callbacks.onQuizResult);
  }

  channel.join()
    .receive('ok', () => console.log('Joined classroom:', sessionId))
    .receive('error', (resp) => console.error('Failed to join:', resp));

  return channel;
}

export function sendMessage(channel: Channel, content: string) {
  channel.push('send_message', { content });
}

export function sendAction(channel: Channel, action: string) {
  channel.push('send_action', { action });
}

export function submitQuiz(channel: Channel, questions: any[], answers: any[]) {
  channel.push('submit_quiz', { questions, answers });
}

export function leaveClassroom(channel: Channel) {
  channel.leave();
}
