export default function ProfileField({ label, value, editing, onToggle, children }) {
    return (
        <div className="rounded-2xl border border-slate-200 p-5 hover:border-blue-200 transition">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 mb-1">
                        {label}
                    </p>

                    {editing ? (
                        <div className="mt-2">{children}</div>
                    ) : (
                        <p className="text-base font-semibold text-slate-900 break-words">
                            {value}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onToggle}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        editing
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                >
                    {editing ? "Hủy" : "Chỉnh sửa"}
                </button>
            </div>
        </div>
    );
}