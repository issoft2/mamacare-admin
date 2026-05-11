/**
 * admin/src/app/dashboard/compliance/page.tsx
 * GDPR/NDPA compliance audit tools.
 */

export default function CompliancePage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-700">Compliance</h1>
        <p className="text-gray-500 mt-1">GDPR · NDPA · DCB0129 audit tools</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Consent Records", desc: "View and audit user consent events" },
          { title: "DSAR Exports", desc: "Subject access request tracking" },
          { title: "Breach Log", desc: "Security incident records" },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h3 className="font-semibold text-gray-800">{item.title}</h3>
            <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
