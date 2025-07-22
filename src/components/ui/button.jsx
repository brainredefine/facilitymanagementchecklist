export default function Button({ children, variant, onClick }) {
  return (
    <button
      className={`px-4 py-2 rounded ${variant === "default" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}