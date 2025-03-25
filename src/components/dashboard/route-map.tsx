import { Map, Plus, Minus } from 'lucide-react'

export function RouteMap() {
  return (
    <div className="relative h-[500px] bg-gray-50 rounded-lg border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
      <div className="text-center p-6 max-w-sm">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Map className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Your route will appear here</h3>
        <p className="text-gray-500 text-sm">Add addresses using the input above and generate a route to see the map visualization</p>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-white p-1.5 rounded-md shadow-sm border border-gray-100">
        <div className="flex flex-col space-y-1">
          <button className="p-1 hover:bg-gray-50 rounded transition-colors" aria-label="Zoom in">
            <Plus className="w-5 h-5 text-gray-700" />
          </button>
          <div className="h-px bg-gray-200 mx-1"></div>
          <button className="p-1 hover:bg-gray-50 rounded transition-colors" aria-label="Zoom out">
            <Minus className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  )
}
