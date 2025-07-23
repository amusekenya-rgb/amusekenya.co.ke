import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Mail, Phone, MapPin, Send, MessageSquare, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { getAvailablePrograms } from '@/services/calendarService';
import { initializeDefaultPrograms, resetDefaultPrograms } from '@/utils/defaultPrograms';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ContactForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    parentName: '',
    email: '',
    phone: '',
    program: '',
    message: ''
  });
  
  const [commentFormData, setCommentFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    const loadPrograms = () => {
      setIsInitializing(true);
      
      // Initialize default programs if none exist
      initializeDefaultPrograms();
      
      // Load available programs from calendar events
      const programs = getAvailablePrograms();
      setAvailablePrograms(programs);
      
      if (programs.length > 0) {
        setFormData(prev => ({ ...prev, program: programs[0].id }));
      }
      
      setIsInitializing(false);
      
      if (programs.length > 0) {
        console.log('Programs loaded successfully:', programs.length);
      }
    };

    loadPrograms();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCommentChange = (e) => {
    const { name, value } = e.target;
    setCommentFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate phone
    if (!formData.phone || formData.phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    // Forward to registration page with all the form data
    navigate(`/register?programId=${formData.program}&parentName=${encodeURIComponent(formData.parentName)}&email=${encodeURIComponent(formData.email)}&phone=${encodeURIComponent(formData.phone)}&message=${encodeURIComponent(formData.message || '')}`);
  };
  
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    setIsCommentSubmitting(true);
    
    // Validate email
    if (!commentFormData.email || !commentFormData.email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setIsCommentSubmitting(false);
      return;
    }
    
    // Simulate comment submission
    setTimeout(() => {
      toast({
        title: "Comment Received!",
        description: "Thank you for your feedback. We'll get back to you soon.",
      });
      
      // Reset form
      setCommentFormData({
        name: '',
        email: '',
        message: ''
      });
      
      setIsCommentSubmitting(false);
    }, 1000);
  };

  // Handle resetting programs for testing
  const handleResetPrograms = () => {
    resetDefaultPrograms();
    const programs = getAvailablePrograms();
    setAvailablePrograms(programs);
    if (programs.length > 0) {
      setFormData(prev => ({ ...prev, program: programs[0].id }));
    }
    toast({
      title: "Programs Reset",
      description: "Default programs have been reloaded for testing.",
    });
  };
  
  const noProgramsAvailable = availablePrograms.length === 0 && !isInitializing;
  
  return (
    <section id="contact" className="py-24 px-4 bg-earth-50 relative overflow-hidden">
      {/* Background Element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-earth-100 -skew-x-12 transform translate-x-1/2 z-0"></div>
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block text-earth-700 bg-earth-100 px-3 py-1 rounded-full text-sm font-medium mb-4">
            Get in Touch
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
            Register or Leave a Comment
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Join our program or share your thoughts with us. We'd love to hear from you!
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="w-full md:w-2/5 bg-forest-700 text-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-8 h-full flex flex-col">
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="bg-white/10 p-2 rounded mr-4">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium">Location</h4>
                    <p className="text-forest-100">Karura Forest, Limuru Road<br />Nairobi, Kenya</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-white/10 p-2 rounded mr-4">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium">Email Us</h4>
                    <p className="text-forest-100">info@karurakidscamp.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-white/10 p-2 rounded mr-4">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium">Call Us</h4>
                    <p className="text-forest-100">+254 712 345 678</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto">
                <h4 className="font-medium mb-2">Camp Hours</h4>
                <p className="text-forest-100">Monday - Friday: 8:00 AM - 4:00 PM</p>
                
                {/* Development Tools */}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-forest-200 mb-2">Development Tools:</p>
                  <Button
                    onClick={handleResetPrograms}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 p-2 h-auto text-xs"
                  >
                    <RefreshCw size={12} className="mr-1" />
                    Reset Programs
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs for Registration and Comments */}
          <div className="w-full md:w-3/5">
            <Tabs defaultValue="register" className="w-full">
              <TabsList className="w-full mb-6 bg-white">
                <TabsTrigger value="register" className="flex-1">
                  Register
                </TabsTrigger>
                <TabsTrigger value="comment" className="flex-1">
                  Leave a Comment
                </TabsTrigger>
              </TabsList>
              
              {/* Registration Form Tab */}
              <TabsContent value="register">
                <div className="glass-card rounded-xl shadow-lg p-8">
                  {isInitializing ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-forest-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading programs...</p>
                    </div>
                  ) : noProgramsAvailable ? (
                    <div className="text-center py-8">
                      <h3 className="text-xl font-semibold mb-4">No Programs Available</h3>
                      <p className="mb-6 text-gray-600">
                        There are currently no upcoming programs available for registration. 
                        Please check back later or contact us for more information.
                      </p>
                      <div className="space-y-2">
                        <Button onClick={() => document.getElementById('comment')?.click()}>
                          Leave a Comment Instead
                        </Button>
                        <br />
                        <Button onClick={handleResetPrograms} variant="outline" size="sm">
                          <RefreshCw size={16} className="mr-2" />
                          Load Sample Programs
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="mb-8">
                        <h3 className="font-semibold text-lg mb-4">Parent/Guardian Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label htmlFor="parentName" className="block text-gray-700 font-medium mb-2">Parent/Guardian Name</label>
                            <input
                              type="text"
                              id="parentName"
                              name="parentName"
                              value={formData.parentName}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all"
                              placeholder="Your Name"
                            />
                          </div>
                          <div>
                            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email Address</label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all"
                              placeholder="your.email@example.com"
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">Phone Number</label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all"
                              placeholder="Your Phone Number"
                            />
                          </div>
                          <div>
                            <label htmlFor="program" className="block text-gray-700 font-medium mb-2">Select Program</label>
                            <select
                              id="program"
                              name="program"
                              value={formData.program}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all appearance-none bg-white"
                            >
                              {availablePrograms.map(program => (
                                <option key={program.id} value={program.id}>
                                  {program.title} ({program.date})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Additional Information</label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all resize-none"
                          placeholder="Any allergies, special needs, or questions?"
                        ></textarea>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                          "w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2",
                          isSubmitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-forest-600 hover:bg-forest-700 text-white shadow-md hover:shadow-lg"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            Proceed to Registration
                            <Send size={18} />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </TabsContent>
              
              {/* Comment Form Tab */}
              <TabsContent value="comment" id="comment">
                <div className="glass-card rounded-xl shadow-lg p-8">
                  <form onSubmit={handleCommentSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="comment-name" className="block text-gray-700 font-medium mb-2">Your Name</label>
                        <input
                          type="text"
                          id="comment-name"
                          name="name"
                          value={commentFormData.name}
                          onChange={handleCommentChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all"
                          placeholder="Your Name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="comment-email" className="block text-gray-700 font-medium mb-2">Email Address</label>
                        <input
                          type="email"
                          id="comment-email"
                          name="email"
                          value={commentFormData.email}
                          onChange={handleCommentChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="comment-message" className="block text-gray-700 font-medium mb-2">Your Comment</label>
                        <Textarea
                          id="comment-message"
                          name="message"
                          value={commentFormData.message}
                          onChange={handleCommentChange}
                          required
                          placeholder="Share your thoughts, questions, or feedback with us..."
                          className="min-h-[150px] resize-none"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isCommentSubmitting}
                        className={cn(
                          "w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2",
                          isCommentSubmitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-earth-600 hover:bg-earth-700 text-white shadow-md hover:shadow-lg"
                        )}
                      >
                        {isCommentSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Comment
                            <MessageSquare size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
