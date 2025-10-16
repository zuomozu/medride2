"use client"
import React, { useState } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  HelpCircle, 
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Support() {
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [supportForm, setSupportForm] = useState({
    subject: "",
    category: "",
    priority: "medium",
    message: "",
    contactMethod: "email"
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleInputChange = (field, value) => {
    setSupportForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!supportForm.subject || !supportForm.category || !supportForm.message) {
        throw new Error("Please fill in all required fields");
      }

      // In a real app, this would create a support ticket
      // For demo purposes, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      setSupportForm({
        subject: "",
        category: "",
        priority: "medium",
        message: "",
        contactMethod: "email"
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportCategories = [
    { value: "booking", label: "Booking Issues" },
    { value: "payment", label: "Payment & Billing" },
    { value: "driver", label: "Driver Related" },
    { value: "accessibility", label: "Accessibility Support" },
    { value: "technical", label: "Technical Issues" },
    { value: "feedback", label: "Feedback & Suggestions" },
    { value: "other", label: "Other" }
  ];

  const priorityLevels = [
    { value: "low", label: "Low - General inquiry" },
    { value: "medium", label: "Medium - Standard support" },
    { value: "high", label: "High - Urgent issue" },
    { value: "emergency", label: "Emergency - Immediate assistance needed" }
  ];

  if (success) {
    return (
      <div className="min-h-screen medical-gradient flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Support Request Sent!</h2>
            <p className="text-gray-600 mb-4">
              We've received your message and will get back to you within 24 hours.
            </p>
            <Button 
              onClick={() => setSuccess(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Send Another Message
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen medical-gradient p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support & Help</h1>
          <p className="text-gray-600">Get assistance with your medical transportation needs</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Emergency Notice */}
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Medical Emergency:</strong> For life-threatening emergencies, call 911 immediately. 
                This support system is for non-emergency assistance only.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Support Form */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={supportForm.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={supportForm.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={supportForm.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={supportForm.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Please provide detailed information about your issue or question..."
                      className="h-32"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactMethod">Preferred Contact Method</Label>
                    <Select value={supportForm.contactMethod} onValueChange={(value) => handleInputChange('contactMethod', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="either">Either Email or Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </div>
                    ) : (
                      'Send Support Request'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Support Information Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Support Hotline</p>
                    <p className="text-blue-600">(555) 123-RIDE</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-blue-600">support@medride.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Hours</p>
                    <p className="text-sm text-gray-600">24/7 Emergency Support</p>
                    <p className="text-sm text-gray-600">Mon-Fri 8AM-8PM General</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  Common Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <div className="text-left">
                    <p className="font-medium text-sm">How to cancel a booking?</p>
                    <p className="text-xs text-gray-500">Learn about cancellation policies</p>
                  </div>
                </Button>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <div className="text-left">
                    <p className="font-medium text-sm">Wheelchair accessibility</p>
                    <p className="text-xs text-gray-500">Vehicle accessibility features</p>
                  </div>
                </Button>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <div className="text-left">
                    <p className="font-medium text-sm">Payment and billing</p>
                    <p className="text-xs text-gray-500">Payment methods and receipts</p>
                  </div>
                </Button>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <div className="text-left">
                    <p className="font-medium text-sm">Insurance coverage</p>
                    <p className="text-xs text-gray-500">Using insurance for rides</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card className="card-hover bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Response Times</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Emergency</span>
                    <span className="text-sm font-medium text-blue-900">Immediate</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">High Priority</span>
                    <span className="text-sm font-medium text-blue-900">2-4 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Standard</span>
                    <span className="text-sm font-medium text-blue-900">24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Low Priority</span>
                    <span className="text-sm font-medium text-blue-900">48 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}