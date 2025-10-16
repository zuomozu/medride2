import React, { useState, useEffect } from "react";
import { Booking } from "@/entities/Booking";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Calendar as CalendarIcon, Users, Accessibility, X, Plus } from "lucide-react";
import { format } from "date-fns";
import AddressAutocomplete from "../booking/AddressAutocomplete";

export default function AdminBookingForm({ onSubmit, onCancel, isLoading }) {
  const [drivers, setDrivers] = useState([]);

  const [formData, setFormData] = useState({
    pickup_address: "",
    pickup_coordinates: null,
    dropoff_address: "",
    dropoff_coordinates: null,
    scheduled_date: null,
    scheduled_time: "",
    assistance_type: "ambulatory",
    passenger_count: 1,
    special_instructions: "",
    estimated_cost: 0,
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    driver_name: "",
    driver_phone: "",
    vehicle_info: "",
    status: "confirmed"
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const allUsers = await User.list();
      const driverUsers = allUsers.filter(u => u.role === 'driver');
      setDrivers(driverUsers);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddressSelect = (field, addressData) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: addressData.address,
      [`${field.split('_')[0]}_coordinates`]: addressData.coordinates
    }));
  };

  const handleDriverSelect = (driverName) => {
    if (driverName === "none") {
      setFormData(prev => ({ ...prev, driver_name: "", driver_phone: "", vehicle_info: "" }));
      return;
    }
    
    const selectedDriver = drivers.find(d => d.full_name === driverName);
    if (selectedDriver) {
      setFormData(prev => ({ 
        ...prev, 
        driver_name: selectedDriver.full_name,
        driver_phone: selectedDriver.phone || "",
        vehicle_info: selectedDriver.vehicle_type || ""
      }));
    }
  };
  
  const calculateEstimatedCost = (data) => {
    const baseFare = 25.00;
    
    let assistanceFee = 0;
    if (data.assistance_type === 'wheelchair') assistanceFee = 7.50;
    else if (data.assistance_type === 'stretcher') assistanceFee = 20.00;
    else if (data.assistance_type === 'walker_assistance') assistanceFee = 5.00;

    let distanceCost = 12.00;
    if (data.pickup_coordinates && data.dropoff_coordinates) {
      const latDiff = data.pickup_coordinates.lat - data.dropoff_coordinates.lat;
      const lngDiff = data.pickup_coordinates.lng - data.dropoff_coordinates.lng;
      const distance = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lngDiff, 2)) * 111;
      distanceCost = distance * 2.50;
    }
    
    const total = baseFare + assistanceFee + distanceCost;
    return total;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const bookingData = {
      ...formData,
      scheduled_date: formData.scheduled_date ? format(formData.scheduled_date, "yyyy-MM-dd") : null,
      estimated_cost: calculateEstimatedCost(formData),
      guest_name: formData.patient_name,
      guest_phone: formData.patient_phone
    };
    
    // Remove admin-specific fields that don't belong in booking entity
    delete bookingData.patient_name;
    delete bookingData.patient_phone;
    delete bookingData.patient_email;

    onSubmit(bookingData);
  };

  const assistanceTypes = [
    { value: "ambulatory", label: "Ambulatory (Walking)", icon: "🚶" },
    { value: "wheelchair", label: "Wheelchair Accessible", icon: "♿" },
    { value: "stretcher", label: "Stretcher/Gurney", icon: "🛏️" },
    { value: "walker_assistance", label: "Walker Assistance", icon: "🦯" }
  ];

  return (
    <Card className="card-hover mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Create New Booking
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Patient Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="patient_name">Patient Name *</Label>
                  <Input
                    id="patient_name"
                    value={formData.patient_name}
                    onChange={(e) => handleInputChange('patient_name', e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patient_phone">Phone Number *</Label>
                  <Input
                    id="patient_phone"
                    value={formData.patient_phone}
                    onChange={(e) => handleInputChange('patient_phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patient_email">Email (Optional)</Label>
                  <Input
                    id="patient_email"
                    type="email"
                    value={formData.patient_email}
                    onChange={(e) => handleInputChange('patient_email', e.target.value)}
                    placeholder="patient@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pickup">Pickup Location *</Label>
                  <AddressAutocomplete
                    value={formData.pickup_address}
                    onChange={(value) => handleInputChange('pickup_address', value)}
                    onSelect={(data) => handleAddressSelect('pickup_address', data)}
                    placeholder="Enter pickup address"
                  />
                </div>
                <div>
                  <Label htmlFor="dropoff">Drop-off Location *</Label>
                  <AddressAutocomplete
                    value={formData.dropoff_address}
                    onChange={(value) => handleInputChange('dropoff_address', value)}
                    onSelect={(data) => handleAddressSelect('dropoff_address', data)}
                    placeholder="Enter destination address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !formData.scheduled_date && "text-muted-foreground"
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.scheduled_date ? (
                            format(formData.scheduled_date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.scheduled_date}
                          onSelect={(date) => handleInputChange('scheduled_date', date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.scheduled_time}
                      onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Assistance Type</Label>
                  <Select value={formData.assistance_type} onValueChange={(value) => handleInputChange('assistance_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assistanceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Number of Passengers</Label>
                  <Select value={formData.passenger_count.toString()} onValueChange={(value) => handleInputChange('passenger_count', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{num} passenger{num > 1 ? 's' : ''}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="special_instructions">Special Instructions</Label>
                  <Textarea
                    id="special_instructions"
                    value={formData.special_instructions}
                    onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                    placeholder="Any special requirements..."
                    className="h-20"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Driver Assignment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Driver Assignment (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Assign Driver</Label>
                  <Select value={formData.driver_name} onValueChange={handleDriverSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a driver (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No driver assigned</SelectItem>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.full_name}>
                          {driver.full_name} - {driver.phone || 'No phone'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Booking Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? 'Creating Booking...' : 'Create Booking'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}