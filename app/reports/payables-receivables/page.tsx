import { getPayablesReceivablesData } from "./actions"
import { PayablesReceivablesView } from "./payables-receivables-view"

export default async function PayablesReceivablesPage() {
  const data = await getPayablesReceivablesData()

  return (
    <div className="flex flex-col h-full gap-4 p-4 pt-0 overflow-hidden">
      <PayablesReceivablesView initialData={data} />
    </div>
  )
}
