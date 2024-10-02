export function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 min-h-[300px]">
        <div className="bg-gradient-to-r from-blue-200 to-purple-200 p-4">
          <h1 className="text-2xl font-bold text-black">
            {title}
          </h1>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
  );
}
