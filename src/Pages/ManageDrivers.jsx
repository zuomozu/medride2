"use client"
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Car, Edit, Trash2, User as UserIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ManageDrivers() {
  const [user, setUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  const [driverForm, setDriverForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    emergency_contact: "",
    driver_license: "",
    vehicle_type: "",
    vehicle_plate: "",
    driver_status: "available"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();

      if (currentUser.role !== 'admin') {
        setError("Access denied. Admin privileges required.");
        return;
      }

      setUser(currentUser);

      // Load all users
      const users = await User.list();
      setAllUsers(users);
      console.log("All Users:", users);
      // Filter drivers
      const driverUsers = users.filter(u => u.role === 'driver');
      console.log("Driver Users:", driverUsers);
      setDrivers(driverUsers);

    } catch (error) {
      setError("Unable to load driver information.");
      console.error('Error loading drivers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!driverForm.full_name || !driverForm.email || !driverForm.phone) {
        throw new Error("Please fill in all required fields");
      }

      // Create driver data without role (to avoid subscription limitation)
      const driverData = {
        full_name: driverForm.full_name,
        email: driverForm.email,
        phone: driverForm.phone,
        address: driverForm.address,
        emergency_contact: driverForm.emergency_contact,
        driver_license: driverForm.driver_license,
        vehicle_type: driverForm.vehicle_type,
        vehicle_plate: driverForm.vehicle_plate,
        driver_status: driverForm.driver_status
      };

      if (editingDriver) {
        // Update existing driver
        await User.update(editingDriver.id, driverData);
        setSuccess("Driver information updated successfully");
      } else {
        // Check if user with this email already exists
        const existingUser = allUsers.find(u => u.email === driverForm.email);
        
        if (existingUser) {
          if (existingUser.role === 'driver') {
            // Update existing driver
            await User.update(existingUser.id, driverData);
            setSuccess("Driver information updated successfully");
          } else {
            // User exists but is not a driver
            setError(`User ${driverForm.email} exists but is not assigned as a driver. Please change their role to 'driver' in the Dashboard > Data > User section first.`);
            setIsLoading(false);
            return;
          }
        } else {
          // User doesn't exist
          setError(`No user found with email ${driverForm.email}. The person must first sign up via Google, then change their role to 'driver' in Dashboard > Data > User.`);
          setIsLoading(false);
          return;
        }
      }

      setDriverForm({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        emergency_contact: "",
        driver_license: "",
        vehicle_type: "",
        vehicle_plate: "",
        driver_status: "available"
      });
      setShowAddForm(false);
      setEditingDriver(null);
      loadData();
      
    } catch (error) {
      setError(error.message || "Failed to save driver information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (driver) => {
    setDriverForm({
      full_name: driver.full_name || "",
      email: driver.email || "",
      phone: driver.phone || "",
      address: driver.address || "",
      emergency_contact: driver.emergency_contact || "",
      driver_license: driver.driver_license || "",
      vehicle_type: driver.vehicle_type || "",
      vehicle_plate: driver.vehicle_plate || "",
      driver_status: driver.driver_status || "available"
    });
    setEditingDriver(driver);
    setShowAddForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (driverId) => {
    if (!confirm("Are you sure you want to remove this driver's information? Note: You'll need to manually change their role in the Dashboard.")) {
      return;
    }
    
    try {
      // Clear driver-specific information but can't change role due to subscription limitation
      await User.update(driverId, { 
        phone: "",
        address: "",
        emergency_contact: "",
        driver_license: "",
        vehicle_type: "",
        vehicle_plate: "",
        driver_status: "inactive"
      });
      setSuccess("Driver information cleared. Please manually change their role to 'user' in Dashboard > Data > User if needed.");
      loadData();
    } catch (error) {
      setError("Failed to remove driver information. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "bg-green-100 text-green-800",
      on_duty: "bg-blue-100 text-blue-800",
      off_duty: "bg-gray-100 text-gray-800",
      inactive: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen medical-gradient p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
            <p className="text-gray-600">Manage your medical transportation drivers</p>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingDriver(null);
              setError(null);
              setSuccess(null);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Update Driver Info
          </Button>
        </div>

        {/* Important Notice */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>How to assign drivers:</strong> Users must first sign up via Google, then go to Dashboard → Data → User to change their role from 'user' to 'driver'. After that, you can update their driver information here.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
                </div>
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {drivers.filter(d => d.driver_status === 'available').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">On Duty</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {drivers.filter(d => d.driver_status === 'on_duty').length}
                  </p>
                </div>
                <Car className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Off Duty</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {drivers.filter(d => d.driver_status === 'off_duty').length}
                  </p>
                </div>
                <span className="text-2xl">💤</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Driver Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingDriver ? 'Edit Driver Information' : 'Update Driver Information'}</CardTitle>
              <p className="text-sm text-gray-600">
                {editingDriver ? 
                  'Update driver information and status.' : 
                  'Enter the email of a user who already has the "driver" role assigned.'
                }
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={driverForm.full_name}
                      onChange={(e) => setDriverForm(prev => ({...prev, full_name: e.target.value}))}
                      placeholder="Driver's full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={driverForm.email}
                      onChange={(e) => setDriverForm(prev => ({...prev, email: e.target.value}))}
                      placeholder="driver@example.com"
                      disabled={editingDriver} // Don't allow email change for existing users
                      required
                    />
                    {!editingDriver && (
                      <p className="text-xs text-gray-500 mt-1">
                        This person must already be signed up and have "driver" role assigned
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm(prev => ({...prev, phone: e.target.value}))}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={driverForm.address}
                      onChange={(e) => setDriverForm(prev => ({...prev, address: e.target.value}))}
                      placeholder="Driver's address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact">Emergency Contact</Label>
                    <Input
                      id="emergency_contact"
                      value={driverForm.emergency_contact}
                      onChange={(e) => setDriverForm(prev => ({...prev, emergency_contact: e.target.value}))}
                      placeholder="Emergency contact information"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver_license">Driver License</Label>
                    <Input
                      id="driver_license"
                      value={driverForm.driver_license}
                      onChange={(e) => setDriverForm(prev => ({...prev, driver_license: e.target.value}))}
                      placeholder="D123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle_type">Vehicle Type</Label>
                    <Input
                      id="vehicle_type"
                      value={driverForm.vehicle_type}
                      onChange={(e) => setDriverForm(prev => ({...prev, vehicle_type: e.target.value}))}
                      placeholder="Honda Odyssey - Wheelchair Accessible"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle_plate">License Plate</Label>
                    <Input
                      id="vehicle_plate"
                      value={driverForm.vehicle_plate}
                      onChange={(e) => setDriverForm(prev => ({...prev, vehicle_plate: e.target.value}))}
                      placeholder="MED-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver_status">Driver Status</Label>
                    <Select value={driverForm.driver_status} onValueChange={(value) => setDriverForm(prev => ({...prev, driver_status: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="on_duty">On Duty</SelectItem>
                        <SelectItem value="off_duty">Off Duty</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? 'Saving...' : (editingDriver ? 'Update Driver' : 'Update Information')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingDriver(null);
                      setDriverForm({
                        full_name: "",
                        email: "",
                        phone: "",
                        address: "",
                        emergency_contact: "",
                        driver_license: "",
                        vehicle_type: "",
                        vehicle_plate: "",
                        driver_status: "available"
                      });
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Drivers List */}
        <div className="grid gap-4">
          {drivers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No drivers found</h3>
                <p className="text-gray-600 mb-6">Users must be assigned the "driver" role first</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                  <h4 className="font-semibold text-blue-900 mb-2">To add drivers:</h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>User signs up via Google</li>
                    <li>Go to Dashboard → Data → User</li>
                    <li>Change their role to "driver"</li>
                    <li>Return here to update their information</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          ) : (
            drivers.map((driver) => (
              <Card key={driver.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid md:grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{driver.full_name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <Phone className="w-3 h-3" />
                          <span>{driver.phone || 'No phone'}</span>
                        </div>
                        <p className="text-sm text-gray-600">{driver.email}</p>
                        <Badge className={`${getStatusColor(driver.driver_status)} mt-2`}>
                          {(driver.driver_status || 'available').replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <Car className="w-3 h-3" />
                          <span>{driver.vehicle_type || 'No vehicle info'}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Plate: {driver.vehicle_plate || 'Not set'}
                        </p>
                        <p className="text-sm text-gray-600">
                          License: {driver.driver_license || 'Not set'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Address: {driver.address || 'Not set'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Emergency: {driver.emergency_contact || 'Not set'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(driver)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(driver.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}