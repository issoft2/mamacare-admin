/**
 * admin/src/app/dashboard/users/page.tsx
 * User management table.
 */

export default function UsersPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-700">Users</h1>
        <p className="text-gray-500 mt-1">Manage registered mothers</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-400 text-center py-12">
          Connect to the API to load user data
        </p>
      </div>
    </div>
  );
}
