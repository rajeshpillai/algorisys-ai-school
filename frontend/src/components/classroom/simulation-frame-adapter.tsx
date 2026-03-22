import SimulationFrame from './simulation-frame';
import { getSimulationTemplate } from '../../lib/simulation-templates';

export default function SimulationFrameAdapter(props: { content: string; params?: string }) {
  const resolvedHtml = () => {
    if (props.params) {
      const match = props.params.match(/template=(\S+)/);
      if (match) {
        const template = getSimulationTemplate(match[1]);
        if (template) return template;
      }
    }
    return props.content;
  };

  return <SimulationFrame html={resolvedHtml()} />;
}
