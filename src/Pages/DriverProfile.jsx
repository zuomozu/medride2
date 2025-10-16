"use client"
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, Car, Edit } from "lucide-react";

export default function DriverProfile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    emergency_contact: "",
    driver_license: "",
    vehicle_type: "",
    vehicle_plate: ""
  });

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setFormData({
          full_name: currentUser.full_name || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          address: currentUser.address || "",
          emergency_contact: currentUser.emergency_contact || "",
          driver_license: currentUser.driver_license || "",
          vehicle_type: currentUser.vehicle_type || "",
          vehicle_plate: currentUser.vehicle_plate || ""
        });
      } catch (error) {
        setError("You must be logged in to view this page.");
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { full_name, email, ...updateData } = formData;
      await User.updateMyUserData(updateData);
      setSuccess("Your profile information has been saved successfully. An administrator will review your application.");
    } catch (error) {
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Driver Profile</h1>
          <p className="text-gray-600">
            {user?.role === 'driver' ? "Manage your driver information." : "Apply to become a driver by filling out the form below."}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-600" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input id="full_name" value={formData.full_name} disabled className="bg-gray-100" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" value={formData.email} disabled className="bg-gray-100" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="(555) 123-4567" required />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="123 Main St, Anytown, USA" />
                    </div>
                    <div>
                      <Label htmlFor="driver_license">Driver License Number</Label>
                      <Input id="driver_license" value={formData.driver_license} onChange={(e) => handleInputChange('driver_license', e.target.value)} placeholder="D123456789" />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact">Emergency Contact</Label>
                      <Input id="emergency_contact" value={formData.emergency_contact} onChange={(e) => handleInputChange('emergency_contact', e.target.value)} placeholder="Name and Phone" />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_type">Vehicle Type</Label>
                      <Input id="vehicle_type" value={formData.vehicle_type} onChange={(e) => handleInputChange('vehicle_type', e.target.value)} placeholder="e.g., Honda Odyssey - Wheelchair" />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_plate">Vehicle License Plate</Label>
                      <Input id="vehicle_plate" value={formData.vehicle_plate} onChange={(e) => handleInputChange('vehicle_plate', e.target.value)} placeholder="MED-001" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                      {isSaving ? "Saving..." : "Save Profile Information"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                {user?.role === 'driver' ? (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="font-semibold">Approved</AlertDescription>
                    <p className="text-sm">You are an approved driver. You can access the driver dashboard.</p>
                  </Alert>
                ) : (
                  <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="font-semibold">Pending Approval</AlertDescription>
                    <p className="text-sm">An administrator will review your application after you save your profile.</p>
                  </Alert>
                )}
              </CardContent>
            </Card>
             <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <p>1. Complete and save your profile information.</p>
                <p>2. Wait for an administrator to review and approve your application.</p>
                <p>3. Once approved, your role will be changed to 'driver'.</p>
                <p>4. You will then be able to access the Driver Dashboard to accept rides.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}