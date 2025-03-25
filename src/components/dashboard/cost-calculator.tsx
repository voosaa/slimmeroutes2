"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Save, Trash, Plus, RefreshCw } from 'lucide-react'

type CostCalculatorProps = {
  totalDistance: number
  totalTime: number
}

type CostPreset = {
  id: string
  name: string
  fuelPrice: number
  fuelConsumption: number
  hourlyRate: number
  maintenanceRate: number
  vehicleType?: string
}

type ComparisonScenario = {
  name: string
  fuelPrice: number
  fuelConsumption: number
  hourlyRate: number
  maintenanceRate: number
  totalCost: number
  fuelCost: number
  timeCost: number
  maintenanceCost: number
}

export function CostCalculator({ totalDistance, totalTime }: CostCalculatorProps) {
  const [fuelPrice, setFuelPrice] = useState(1.80)
  const [fuelConsumption, setFuelConsumption] = useState(8)
  const [hourlyRate, setHourlyRate] = useState(30)
  const [maintenanceRate, setMaintenanceRate] = useState(0.05)
  const [vehicleType, setVehicleType] = useState('Standard')
  const [presetName, setPresetName] = useState('')
  const [presets, setPresets] = useState<CostPreset[]>([])
  const [isLoadingPresets, setIsLoadingPresets] = useState(false)
  const [isSavingPreset, setIsSavingPreset] = useState(false)
  const [scenarios, setScenarios] = useState<ComparisonScenario[]>([])
  const [currentFuelPrice, setCurrentFuelPrice] = useState<number | null>(null)
  
  const { toast } = useToast()
  const { user } = useAuth()
  
  // Calculate costs
  const fuelCost = totalDistance * (fuelConsumption / 100) * fuelPrice
  const timeCost = (totalTime / 60) * hourlyRate
  const maintenanceCost = totalDistance * maintenanceRate
  const totalCost = fuelCost + timeCost + maintenanceCost
  
  // Data for pie chart
  const costData = [
    { name: 'Fuel', value: fuelCost, color: '#3B82F6' },
    { name: 'Time', value: timeCost, color: '#10B981' },
    { name: 'Maintenance', value: maintenanceCost, color: '#F59E0B' }
  ]

  // Fetch current fuel price from API (mock for now)
  useEffect(() => {
    const fetchCurrentFuelPrice = async () => {
      try {
        // In a real app, this would call an API to get current fuel prices
        // For now, we'll simulate with a random value around the current price
        const mockPrice = 1.75 + (Math.random() * 0.2 - 0.1);
        setCurrentFuelPrice(parseFloat(mockPrice.toFixed(2)));
      } catch (error) {
        console.error('Error fetching fuel price:', error);
      }
    };

    fetchCurrentFuelPrice();
  }, []);
  
  // Load presets from Supabase
  useEffect(() => {
    const loadPresets = async () => {
      if (!user || !supabase) return;
      
      try {
        setIsLoadingPresets(true);
        
        const { data, error } = await supabase
          .from('cost_presets')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setPresets(data as CostPreset[]);
        }
      } catch (error) {
        console.error('Error loading cost presets:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your cost presets',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingPresets(false);
      }
    };
    
    if (user) {
      loadPresets();
    }
  }, [user, toast]);
  
  const handleSavePreset = async () => {
    if (!user || !supabase) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save presets',
        variant: 'destructive'
      });
      return;
    }
    
    if (!presetName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for your preset',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSavingPreset(true);
      
      const newPreset = {
        user_id: user.id,
        name: presetName,
        fuelPrice,
        fuelConsumption,
        hourlyRate,
        maintenanceRate,
        vehicleType
      };
      
      const { data, error } = await supabase
        .from('cost_presets')
        .insert(newPreset)
        .select();
      
      if (error) throw error;
      
      if (data) {
        setPresets([...presets, data[0] as CostPreset]);
        setPresetName('');
        
        toast({
          title: 'Success',
          description: 'Cost preset saved successfully'
        });
      }
    } catch (error) {
      console.error('Error saving cost preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to save cost preset',
        variant: 'destructive'
      });
    } finally {
      setIsSavingPreset(false);
    }
  };
  
  const handleDeletePreset = async (presetId: string) => {
    if (!user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('cost_presets')
        .delete()
        .eq('id', presetId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setPresets(presets.filter(preset => preset.id !== presetId));
      
      toast({
        title: 'Success',
        description: 'Cost preset deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting cost preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete cost preset',
        variant: 'destructive'
      });
    }
  };
  
  const handleLoadPreset = (preset: CostPreset) => {
    setFuelPrice(preset.fuelPrice);
    setFuelConsumption(preset.fuelConsumption);
    setHourlyRate(preset.hourlyRate);
    setMaintenanceRate(preset.maintenanceRate);
    setVehicleType(preset.vehicleType || 'Standard');
    
    toast({
      title: 'Preset Loaded',
      description: `Loaded preset: ${preset.name}`
    });
  };
  
  const handleAddToComparison = () => {
    const newScenario: ComparisonScenario = {
      name: vehicleType,
      fuelPrice,
      fuelConsumption,
      hourlyRate,
      maintenanceRate,
      totalCost,
      fuelCost,
      timeCost,
      maintenanceCost
    };
    
    // Limit to 3 scenarios for comparison
    if (scenarios.length >= 3) {
      setScenarios([...scenarios.slice(1), newScenario]);
    } else {
      setScenarios([...scenarios, newScenario]);
    }
    
    toast({
      title: 'Added to Comparison',
      description: `Added ${vehicleType} scenario to comparison`
    });
  };
  
  const handleClearComparisons = () => {
    setScenarios([]);
  };
  
  const handleUseCurrentFuelPrice = () => {
    if (currentFuelPrice) {
      setFuelPrice(currentFuelPrice);
      toast({
        title: 'Updated Fuel Price',
        description: `Set to current market price: €${currentFuelPrice.toFixed(2)}/L`
      });
    }
  };
  
  // Vehicle type presets
  const vehiclePresets = {
    'Economy': { fuelConsumption: 5.5, maintenanceRate: 0.03 },
    'Standard': { fuelConsumption: 8.0, maintenanceRate: 0.05 },
    'SUV': { fuelConsumption: 10.5, maintenanceRate: 0.07 },
    'Van': { fuelConsumption: 12.0, maintenanceRate: 0.08 },
    'Electric': { fuelConsumption: 0, maintenanceRate: 0.04 }
  };
  
  const handleVehicleTypeChange = (type: string) => {
    setVehicleType(type);
    
    if (type === 'Electric') {
      // Electric vehicles don't use fuel but use electricity
      setFuelPrice(0.25); // Price per kWh
      setFuelConsumption(20); // kWh/100km
    } else if (type in vehiclePresets) {
      // @ts-ignore
      const preset = vehiclePresets[type];
      setFuelConsumption(preset.fuelConsumption);
      setMaintenanceRate(preset.maintenanceRate);
    }
  };
  
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
        <CardTitle className="text-xl text-gray-900">Cost Calculator</CardTitle>
        <CardDescription className="text-gray-600">Estimate and compare the total cost of your route</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="calculator">
          <TabsList className="mb-6 bg-gray-50 p-1 rounded-md">
            <TabsTrigger 
              value="calculator" 
              className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm rounded-md px-4 py-2 transition-all"
            >
              Calculator
            </TabsTrigger>
            <TabsTrigger 
              value="presets" 
              className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm rounded-md px-4 py-2 transition-all"
            >
              Presets
            </TabsTrigger>
            <TabsTrigger 
              value="comparison" 
              className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm rounded-md px-4 py-2 transition-all"
            >
              Comparison
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Vehicle Type</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.keys(vehiclePresets).map(type => (
                      <Button
                        key={type}
                        variant={vehicleType === type ? "default" : "outline"}
                        size="sm"
                        className={vehicleType === type 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"}
                        onClick={() => handleVehicleTypeChange(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="fuel-price" className="text-gray-700">
                        {vehicleType === 'Electric' ? 'Electricity Price (€/kWh)' : 'Fuel Price (€/L)'}
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{fuelPrice.toFixed(2)} {vehicleType === 'Electric' ? '€/kWh' : '€/L'}</span>
                        {currentFuelPrice && vehicleType !== 'Electric' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-6 px-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={handleUseCurrentFuelPrice}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Use Current
                          </Button>
                        )}
                      </div>
                    </div>
                    <Slider
                      id="fuel-price"
                      min={0.1}
                      max={3}
                      step={0.01}
                      value={[fuelPrice]}
                      onValueChange={(value) => setFuelPrice(value[0])}
                      disabled={vehicleType === 'Electric' && fuelPrice === 0}
                      className="[&>span]:bg-emerald-500"
                    />
                    {vehicleType === 'Electric' && (
                      <p className="text-xs text-gray-500 italic">Electric vehicles use electricity instead of fuel</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="fuel-consumption" className="text-gray-700">
                        {vehicleType === 'Electric' ? 'Energy Consumption (kWh/100km)' : 'Fuel Consumption (L/100km)'}
                      </Label>
                      <span className="text-sm font-medium text-gray-900">
                        {fuelConsumption.toFixed(1)} {vehicleType === 'Electric' ? 'kWh/100km' : 'L/100km'}
                      </span>
                    </div>
                    <Slider
                      id="fuel-consumption"
                      min={vehicleType === 'Electric' ? 10 : 4}
                      max={vehicleType === 'Electric' ? 30 : 15}
                      step={0.1}
                      value={[fuelConsumption]}
                      onValueChange={(value) => setFuelConsumption(value[0])}
                      className="[&>span]:bg-emerald-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="hourly-rate" className="text-gray-700">Hourly Rate (€/h)</Label>
                      <span className="text-sm font-medium text-gray-900">{hourlyRate.toFixed(0)} €/h</span>
                    </div>
                    <Slider
                      id="hourly-rate"
                      min={10}
                      max={100}
                      step={1}
                      value={[hourlyRate]}
                      onValueChange={(value) => setHourlyRate(value[0])}
                      className="[&>span]:bg-emerald-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="maintenance-rate" className="text-gray-700">Maintenance Cost (€/km)</Label>
                      <span className="text-sm font-medium text-gray-900">{maintenanceRate.toFixed(2)} €/km</span>
                    </div>
                    <Slider
                      id="maintenance-rate"
                      min={0.01}
                      max={0.2}
                      step={0.01}
                      value={[maintenanceRate]}
                      onValueChange={(value) => setMaintenanceRate(value[0])}
                      className="[&>span]:bg-emerald-500"
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Preset name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="flex-1 border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                    />
                    <Button 
                      onClick={handleSavePreset}
                      disabled={isSavingPreset || !presetName.trim() || !user}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isSavingPreset ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                          Saving
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleAddToComparison}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Compare
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="h-[220px] bg-gray-50 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {costData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(2)} €`, 'Cost']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-4">Cost Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        {vehicleType === 'Electric' ? 'Electricity Cost:' : 'Fuel Cost:'}
                      </span>
                      <span className="font-medium text-gray-900">{fuelCost.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                        Time Cost:
                      </span>
                      <span className="font-medium text-gray-900">{timeCost.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                        Maintenance Cost:
                      </span>
                      <span className="font-medium text-gray-900">{maintenanceCost.toFixed(2)} €</span>
                    </div>
                    <div className="pt-2 flex justify-between font-bold text-lg">
                      <span className="text-gray-900">Total Cost:</span>
                      <span className="text-emerald-600">{totalCost.toFixed(2)} €</span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-3 bg-white p-3 rounded border border-gray-100">
                      <div className="flex justify-between mb-1">
                        <span>Distance:</span>
                        <span className="font-medium">{totalDistance.toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Time:</span>
                        <span className="font-medium">{Math.floor(totalTime / 60)}h {Math.round(totalTime % 60)}m</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-100 mt-1">
                        <span>Cost per km:</span>
                        <span className="font-medium">{(totalCost / (totalDistance || 1)).toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="presets">
            <div className="space-y-4">
              {isLoadingPresets ? (
                <div className="text-center py-12 flex flex-col items-center">
                  <div className="animate-spin h-8 w-8 mb-4 border-2 border-emerald-600 rounded-full border-t-transparent"></div>
                  <p className="text-gray-600">Loading your presets...</p>
                </div>
              ) : presets.length === 0 ? (
                <div className="text-center py-12 px-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-gray-700 mb-2">You don't have any saved presets yet.</p>
                  <p className="text-sm text-gray-500">Save your current settings as a preset to quickly access them later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {presets.map(preset => (
                    <Card key={preset.id} className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white border-b">
                        <CardTitle className="text-lg text-gray-900">{preset.name}</CardTitle>
                        <CardDescription className="text-gray-600">
                          {preset.vehicleType || 'Standard'} Vehicle
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 pt-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center py-1 border-b border-gray-100">
                            <span className="text-gray-600">
                              {preset.vehicleType === 'Electric' ? 'Electricity Price:' : 'Fuel Price:'}
                            </span>
                            <span className="font-medium text-gray-900">
                              {preset.fuelPrice.toFixed(2)} {preset.vehicleType === 'Electric' ? '€/kWh' : '€/L'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-100">
                            <span className="text-gray-600">
                              {preset.vehicleType === 'Electric' ? 'Energy Consumption:' : 'Fuel Consumption:'}
                            </span>
                            <span className="font-medium text-gray-900">
                              {preset.fuelConsumption.toFixed(1)} {preset.vehicleType === 'Electric' ? 'kWh/100km' : 'L/100km'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-100">
                            <span className="text-gray-600">Hourly Rate:</span>
                            <span className="font-medium text-gray-900">{preset.hourlyRate.toFixed(0)} €/h</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">Maintenance:</span>
                            <span className="font-medium text-gray-900">{preset.maintenanceRate.toFixed(2)} €/km</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2 pb-3 bg-gray-50 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleLoadPreset(preset)}
                        >
                          Load Preset
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeletePreset(preset.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="comparison">
            <div className="space-y-6">
              {scenarios.length === 0 ? (
                <div className="text-center py-12 px-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-gray-700 mb-2">You haven't added any scenarios to compare yet.</p>
                  <p className="text-sm text-gray-500">Use the "Compare" button to add your current settings as a scenario.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Scenario</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-700">Fuel Cost</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-700">Time Cost</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-700">Maintenance</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-700">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scenarios.map((scenario, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-3 px-4 font-medium text-gray-900">{scenario.name}</td>
                              <td className="text-right py-3 px-4 text-gray-700">{scenario.fuelCost.toFixed(2)} €</td>
                              <td className="text-right py-3 px-4 text-gray-700">{scenario.timeCost.toFixed(2)} €</td>
                              <td className="text-right py-3 px-4 text-gray-700">{scenario.maintenanceCost.toFixed(2)} €</td>
                              <td className="text-right py-3 px-4 font-medium text-emerald-600">{scenario.totalCost.toFixed(2)} €</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="h-[300px] bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={scenarios}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fill: '#4b5563' }} />
                        <YAxis tick={{ fill: '#4b5563' }} />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(2)} €`, 'Cost']}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                        />
                        <Legend />
                        <Bar dataKey="fuelCost" name="Fuel Cost" fill="#3B82F6" />
                        <Bar dataKey="timeCost" name="Time Cost" fill="#10B981" />
                        <Bar dataKey="maintenanceCost" name="Maintenance Cost" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearComparisons}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Clear Comparisons
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="bg-gray-50 border-t p-4 flex justify-between">
        <div className="text-xs text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => {
              // Reset to defaults
              setFuelPrice(1.80);
              setFuelConsumption(8);
              setHourlyRate(30);
              setMaintenanceRate(0.05);
              setVehicleType('Standard');
              
              toast({
                title: 'Reset to Defaults',
                description: 'Calculator values have been reset to default settings'
              });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          {user && (
            <Button 
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAddToComparison}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Comparison
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
