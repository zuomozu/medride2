"use client"
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Shield, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PaymentMethods() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Mock payment methods for demonstration
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  const [newCard, setNewCard] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: ""
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // In a real app, this would load actual payment methods from Stripe/payment processor
      // For demo purposes, we'll simulate some saved cards
      if (currentUser.preferred_payment_method) {
        setPaymentMethods([
          {
            id: "card_1",
            type: "visa",
            last4: "4242",
            expiry: "12/26",
            isDefault: true
          }
        ]);
      }
    } catch (error) {
      setError("Unable to load payment information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would integrate with Stripe or another payment processor
      // For demo purposes, we'll simulate adding a card
      const mockCardId = `card_${Date.now()}`;
      const last4 = newCard.cardNumber.slice(-4);
      
      const newPaymentMethod = {
        id: mockCardId,
        type: getCardType(newCard.cardNumber),
        last4: last4,
        expiry: newCard.expiryDate,
        isDefault: paymentMethods.length === 0
      };

      setPaymentMethods(prev => [...prev, newPaymentMethod]);
      
      // Update user's preferred payment method if this is their first card
      if (paymentMethods.length === 0) {
        await User.updateMyUserData({ preferred_payment_method: mockCardId });
      }

      setNewCard({ cardNumber: "", expiryDate: "", cvv: "", nameOnCard: "" });
      setShowAddForm(false);
      setSuccess("Payment method added successfully");
      
    } catch (error) {
      setError("Failed to add payment method. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCardType = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    return 'card';
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    const matches = cleaned.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return cleaned;
    }
  };

  const removePaymentMethod = (methodId) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
    setSuccess("Payment method removed");
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen medical-gradient p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Methods</h1>
          <p className="text-gray-600">Manage your payment options for medical transportation</p>
        </div>

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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Saved Payment Methods */}
            <Card className="card-hover">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Saved Payment Methods
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Card
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No payment methods</h3>
                    <p className="text-gray-600 mb-4">Add a payment method to book rides</p>
                    <Button
                      onClick={() => setShowAddForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add Your First Card
                    </Button>
                  </div>
                ) : (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs font-semibold uppercase">{method.type}</span>
                        </div>
                        <div>
                          <p className="font-medium">•••• {method.last4}</p>
                          <p className="text-sm text-gray-600">Expires {method.expiry}</p>
                        </div>
                        {method.isDefault && (
                          <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePaymentMethod(method.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Add New Card Form */}
            {showAddForm && (
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Add New Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCard} className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        value={newCard.cardNumber}
                        onChange={(e) => setNewCard(prev => ({ 
                          ...prev, 
                          cardNumber: formatCardNumber(e.target.value) 
                        }))}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          value={newCard.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.substring(0, 2) + '/' + value.substring(2, 4);
                            }
                            setNewCard(prev => ({ ...prev, expiryDate: value }));
                          }}
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          value={newCard.cvv}
                          onChange={(e) => setNewCard(prev => ({ 
                            ...prev, 
                            cvv: e.target.value.replace(/\D/g, '') 
                          }))}
                          placeholder="123"
                          maxLength="4"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="nameOnCard">Name on Card</Label>
                      <Input
                        id="nameOnCard"
                        value={newCard.nameOnCard}
                        onChange={(e) => setNewCard(prev => ({ ...prev, nameOnCard: e.target.value }))}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Adding...' : 'Add Payment Method'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Security Info */}
          <div className="space-y-6">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Payment Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600">256-bit SSL encryption</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600">PCI DSS compliant</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600">No card details stored locally</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600">Secure payment processing</p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Payment Options</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Pay at booking or after ride completion. We accept all major credit and debit cards.
                </p>
                <p className="text-xs text-blue-600">
                  Need help with payment? Contact our support team.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}