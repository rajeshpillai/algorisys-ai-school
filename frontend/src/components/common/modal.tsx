import type { ParentComponent } from 'solid-js';
import { Show } from 'solid-js';

interface ModalProps {
  open: boolean;
  onClose: () => void;
}

const Modal: ParentComponent<ModalProps> = (props) => {
  return (
    <Show when={props.open}>
      <div class="modal-overlay" onClick={props.onClose}>
        <div class="modal-content" onClick={(e) => e.stopPropagation()}>
          {props.children}
        </div>
      </div>
    </Show>
  );
};

export default Modal;
