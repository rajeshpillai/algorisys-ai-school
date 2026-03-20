import SimulationFrame from './simulation-frame';

export default function SimulationFrameAdapter(props: { content: string }) {
  return <SimulationFrame html={props.content} />;
}
