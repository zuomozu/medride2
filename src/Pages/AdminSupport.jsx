"use client"
import React, { useState, useEffect } from "react";

import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  User as UserIcon,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSupport() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState("");

  // Mock support tickets for demonstration
  const [supportTickets] = useState([
    {
      id: "ticket_1",
      subject: "Unable to cancel my booking",
      category: "booking",
      priority: "high",
      status: "open",
      created_date: "2025-01-14T10:30:00Z",
      customer_email: "patient@example.com",
      customer_name: "Mary Johnson",
      message: "I need to cancel my appointment tomorrow but the cancel button isn't working. This is urgent as I need to reschedule.",
      responses: []
    },
    {
      id: "ticket_2",
      subject: "Payment not processed correctly",
      category: "payment",
      priority: "medium",
      status: "in_progress",
      created_date: "2025-01-13T14:15:00Z",
      customer_email: "caregiver@example.com",
      customer_name: "Robert Smith",
      message: "I was charged twice for the same ride on January 10th. My card shows two transactions of $32.50 each.",
      responses: [
        {
          id: "resp_1",
          message: "Thank you for contacting us. I'm looking into this duplicate charge issue and will have an update for you within 24 hours.",
          timestamp: "2025-01-13T15:30:00Z",
          admin_name: "Support Team"
        }
      ]
    },
    {
      id: "ticket_3",
      subject: "Wheelchair accessibility question",
      category: "accessibility",
      priority: "low",
      status: "resolved",
      created_date: "2025-01-12T09:20:00Z",
      customer_email: "senior@example.com",
      customer_name: "Helen Davis",
      message: "Can you confirm that your vehicles can accommodate electric wheelchairs? Mine is quite large.",
      responses: [
        {
          id: "resp_2",
          message: "Yes, all our wheelchair-accessible vehicles can accommodate electric wheelchairs up to 30 inches wide and 48 inches long. We'll make note of your requirements for future bookings.",
          timestamp: "2025-01-12T10:45:00Z",
          admin_name: "Support Team"
        }
      ]
    },
    {
      id: "ticket_4",
      subject: "Driver was 20 minutes late",
      category: "driver",
      priority: "medium",
      status: "open",
      created_date: "2025-01-14T16:00:00Z",
      customer_email: "patient2@example.com",
      customer_name: "James Wilson",
      message: "My driver arrived 20 minutes late for my dialysis appointment. This caused me to miss part of my treatment. I need this addressed.",
      responses: []
    }
  ]);

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
    } catch (error) {
      setError("Unable to load support data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResponse = async (ticketId) => {
    if (!response.trim()) return;
    
    // In a real app, this would send the response to the backend
    // For demo purposes, we'll just simulate the action
    console.log(`Sending response to ticket ${ticketId}:`, response);
    setResponse("");
    setSelectedTicket(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "bg-red-100 text-red-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
      emergency: "bg-red-200 text-red-900"
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filterTickets = (status) => {
    if (status === 'active') {
      return supportTickets.filter(t => ['open', 'in_progress'].includes(t.status));
    }
    if (status === 'resolved') {
      return supportTickets.filter(t => t.status === 'resolved');
    }
    return supportTickets;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Management</h1>
          <p className="text-gray-600">Manage customer support requests and inquiries</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{supportTickets.length}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Open</p>
                  <p className="text-2xl font-bold text-red-600">
                    {supportTickets.filter(t => t.status === 'open').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {supportTickets.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {supportTickets.filter(t => t.status === 'resolved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="all">All Tickets ({supportTickets.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({filterTickets('active').length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({filterTickets('resolved').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {supportTickets.map((ticket) => (
                <Card key={ticket.id} className="card-hover">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          {ticket.subject}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            <span>{ticket.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{ticket.customer_email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(ticket.created_date), "MMM d, yyyy h:mm a")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">{ticket.message}</p>
                    </div>

                    {ticket.responses.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Responses:</h4>
                        {ticket.responses.map((resp) => (
                          <div key={resp.id} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-600">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-blue-900">{resp.admin_name}</span>
                              <span className="text-xs text-blue-600">
                                {format(new Date(resp.timestamp), "MMM d, h:mm a")}
                              </span>
                            </div>
                            <p className="text-sm text-blue-800">{resp.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedTicket?.id === ticket.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Type your response to the customer..."
                          className="h-24"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSendResponse(ticket.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!response.trim()}
                          >
                            Send Response
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedTicket(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      ticket.status !== 'resolved' && (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedTicket(ticket)}
                          className="w-full"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Respond to Customer
                        </Button>
                      )
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4">
              {filterTickets('active').map((ticket) => (
                <Card key={ticket.id} className="card-hover">
                  {/* Same ticket card structure as above */}
                  <CardContent className="p-6">
                    <p className="text-gray-600">Active tickets will be displayed here...</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            <div className="grid gap-4">
              {filterTickets('resolved').map((ticket) => (
                <Card key={ticket.id} className="card-hover">
                  {/* Same ticket card structure as above */}
                  <CardContent className="p-6">
                    <p className="text-gray-600">Resolved tickets will be displayed here...</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}