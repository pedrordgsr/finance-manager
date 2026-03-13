import { getDreData } from "./actions"
import { DREView } from "./dre-view"

export default async function DrePage() {
  const currentYear = new Date().getFullYear()
  const data = await getDreData(currentYear)

  return (
    <div className="flex flex-col h-full gap-4 p-4 pt-0 overflow-hidden">
      <DREView initialData={data} currentYear={currentYear} />
    </div>
  )
}
