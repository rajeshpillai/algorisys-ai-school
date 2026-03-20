import WhiteboardCanvas from './whiteboard-canvas';

export default function WhiteboardCanvasAdapter(props: { content: string }) {
  return <WhiteboardCanvas svg={props.content} />;
}
