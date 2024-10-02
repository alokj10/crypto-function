"use client"

export const TextInput = ({
    placeholder,
    onChange,
    label,
    value,
    type = "text",
    readonly = false
}: {
    placeholder: string;
    onChange: (value: string) => void;
    label: string;
    value: string | number;
    type?: string;
    readonly?: boolean;
}) => {
    return <div className="pt-2">
        <label className="block mb-2 text-sm font-medium text-gray-900">{label}</label>
        <input onChange={(e) => onChange(e.target.value)} value={value} readOnly={readonly} type={type} className="bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder={placeholder} />
    </div>
}