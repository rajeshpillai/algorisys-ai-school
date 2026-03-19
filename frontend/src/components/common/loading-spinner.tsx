import type { Component } from 'solid-js';

interface LoadingSpinnerProps {
  small?: boolean;
}

const LoadingSpinner: Component<LoadingSpinnerProps> = (props) => {
  return (
    <div class="loading-spinner-container">
      <div
        class="loading-spinner"
        classList={{ small: props.small }}
      />
    </div>
  );
};

export default LoadingSpinner;
