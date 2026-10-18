import "./Toast.css"

interface ToastProps {
  success: boolean;
  message: string;
}

function Toast({ success, message }: ToastProps) {
  return (
    <div className={success ? "toast toast-success" : "toast toast-error"}>
      {message}
    </div>
  );
}

export default Toast;