"use client"
export const Select = ({ options, onSelect, label }: {
    onSelect: (value: string) => void;
    options: {
        key: string;
        value: string;
    }[];
    label:string;
}) => {
    return <div className="pt-2">
    {label && (<label className="block mb-2 text-sm font-medium text-gray-900">{label}</label>)}
    <select onChange={(e) => {
        onSelect(e.target.value)
        }} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
        {options.map(option => <option key={option.key} value={option.value}>{option.value}</option>)}
    </select>
  </div>
}