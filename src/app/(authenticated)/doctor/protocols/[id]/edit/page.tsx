'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  XMarkIcon,
  InformationCircleIcon,
  PlayIcon,
  EyeIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { ProtocolEditTabs } from '@/components/protocol/protocol-edit-tabs';
import { ProtocolDayEditor } from '@/components/protocol/protocol-day-editor';
import { ConsultationDatePicker } from '@/components/ConsultationDatePicker';

interface ProtocolTask {
  id: string;
  title: string;
  order: number;
  hasMoreInfo?: boolean;
  videoUrl?: string;
  fullExplanation?: string;
  productId?: string;
  modalTitle?: string;
  modalButtonText?: string;
  modalButtonUrl?: string;
}

interface ProtocolSession {
  id: string;
  name: string;
  order: number;
  tasks: ProtocolTask[];
}

interface ProtocolDay {
  id: string;
  dayNumber: number;
  title?: string;
  sessions: ProtocolSession[];
  tasks: ProtocolTask[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  originalPrice?: number;
  discountPrice?: number;
  discountPercentage?: number;
  purchaseUrl?: string;
  isActive?: boolean;
  usageStats?: number;
  createdAt?: string;
  updatedAt?: string;
  doctorId?: string;
  _count?: {
    protocolProducts: number;
  };
}

interface ProtocolProduct {
  id: string;
  productId: string;
  order: number;
  isRequired: boolean;
  notes?: string;
  product: Product;
}

interface ProtocolForm {
  name: string;
  duration: number;
  description: string;
  isTemplate: boolean;
  showDoctorInfo: boolean;
  modalTitle: string;
  modalVideoUrl: string;
  modalDescription: string;
  modalButtonText: string;
  modalButtonUrl: string;
  coverImage: string;
  days: ProtocolDay[];
  products: ProtocolProduct[];
  consultation_date?: string | null;
  onboardingTemplateId?: string | null;
}

export default function EditProtocolPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProtocol, setIsLoadingProtocol] = useState(true);
  const [isProtocolLoaded, setIsProtocolLoaded] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImprovingName, setIsImprovingName] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [showAISuccessAlert, setShowAISuccessAlert] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [showDuplicateSuccessAlert, setShowDuplicateSuccessAlert] = useState(false);
  const [availableOnboardingTemplates, setAvailableOnboardingTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [protocol, setProtocol] = useState<ProtocolForm>({
    name: '',
    duration: 7,
    description: '',
    isTemplate: false,
    showDoctorInfo: false,
    modalTitle: '',
    modalVideoUrl: '',
    modalDescription: '',
    modalButtonText: '',
    modalButtonUrl: '',
    coverImage: '',
    days: [],
    products: [],
    consultation_date: undefined,
    onboardingTemplateId: null
  });

  useEffect(() => {
    if (params.id) {
      loadProtocol(params.id as string);
      loadAvailableProducts();
      loadAvailableOnboardingTemplates();
    }
  }, [params.id]);

  const loadAvailableOnboardingTemplates = async () => {
    try {
      console.log('🔍 Loading available onboarding templates...');
      const response = await fetch('/api/onboarding-templates');
      console.log('📡 Onboarding Templates API response status:', response.status);
      console.log('📡 Onboarding Templates API response ok:', response.ok);
      
      if (response.ok) {
        const templates = await response.json();
        console.log('✅ Available onboarding templates loaded:', templates.length);
        setAvailableOnboardingTemplates(templates);
      } else {
        console.error('❌ Failed to load onboarding templates:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading onboarding templates:', error);
    }
  };

  const loadProtocol = async (protocolId: string) => {
    try {
      setIsLoadingProtocol(true);
      console.log('🔍 Loading protocol:', protocolId);
      
      const response = await fetch(`/api/protocols/${protocolId}`);
      console.log('📡 Protocol API response status:', response.status);
      console.log('📡 Protocol API response ok:', response.ok);
      console.log('📡 Protocol API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Protocol data loaded successfully:', data.name);
        console.log('✅ Protocol data structure:', {
          id: data.id,
          name: data.name,
          doctorId: data.doctorId,
          duration: data.duration,
          daysCount: data.days?.length || 0,
          onboardingTemplateId: data.onboardingTemplateId
        });
        
        // Load protocol products
        const productsResponse = await fetch(`/api/protocols/${protocolId}/products`);
        console.log('📡 Products API response status:', productsResponse.status);
        console.log('📡 Products API response ok:', productsResponse.ok);
        
        let protocolProducts = [];
        if (productsResponse.ok) {
          protocolProducts = await productsResponse.json();
          console.log('✅ Protocol products loaded:', protocolProducts.length);
        } else {
          console.log('⚠️ Products API failed, continuing without products');
        }
        
        console.log('🔄 Setting protocol state...');
        setProtocol({
          name: data.name,
          duration: data.days?.length || 0,
          description: data.description || '',
          isTemplate: data.isTemplate,
          showDoctorInfo: data.showDoctorInfo || false,
          modalTitle: data.modalTitle || '',
          modalVideoUrl: data.modalVideoUrl || '',
          modalDescription: data.modalDescription || '',
          modalButtonText: data.modalButtonText || '',
          modalButtonUrl: data.modalButtonUrl || '',
          coverImage: data.coverImage || '',
          days: data.days.map((day: any) => ({
            id: day.id,
            dayNumber: day.dayNumber,
            title: day.title || `Day ${day.dayNumber}`,
            sessions: day.sessions.map((session: any) => ({
              id: session.id,
              name: session.name,
              order: session.order,
              tasks: session.tasks.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description || '',
                order: task.order,
                hasMoreInfo: task.hasMoreInfo || false,
                videoUrl: task.videoUrl || '',
                fullExplanation: task.fullExplanation || '',
                productId: task.productId || '',
                modalTitle: task.modalTitle || '',
                modalButtonText: task.modalButtonText || '',
                modalButtonUrl: task.modalButtonUrl || ''
              }))
            })),
            tasks: day.tasks?.map((task: any) => ({
              id: task.id,
              title: task.title,
              description: task.description || '',
              order: task.order,
              hasMoreInfo: task.hasMoreInfo || false,
              videoUrl: task.videoUrl || '',
              fullExplanation: task.fullExplanation || '',
              productId: task.productId || '',
              modalTitle: task.modalTitle || '',
              modalButtonText: task.modalButtonText || '',
              modalButtonUrl: task.modalButtonUrl || ''
            })) || []
          })),
          products: protocolProducts,
          consultation_date: data.consultation_date || undefined,
          onboardingTemplateId: data.onboardingTemplateId || null
        });
        
        setIsProtocolLoaded(true);
        console.log('✅ Protocol state set successfully');
      } else {
        console.error('❌ Failed to load protocol:', response.status, response.statusText);
        setErrorMessage('Failed to load protocol');
        setShowErrorAlert(true);
      }
    } catch (error) {
      console.error('❌ Error loading protocol:', error);
      setErrorMessage('Error loading protocol');
      setShowErrorAlert(true);
    } finally {
      setIsLoadingProtocol(false);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      console.log('🔍 Loading available products...');
      const response = await fetch('/api/products');
      console.log('📡 Products API response status:', response.status);
      console.log('📡 Products API response ok:', response.ok);
      
      if (response.ok) {
        const products = await response.json();
        console.log('✅ Available products loaded:', products.length);
        setAvailableProducts(products);
      } else {
        console.error('❌ Failed to load products:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading products:', error);
    }
  };

  const addTask = (dayNumber: number, sessionId?: string) => {
    const newTask: ProtocolTask = {
      id: `temp-${Date.now()}`,
      title: '',
      order: 0,
      hasMoreInfo: false,
      videoUrl: '',
      fullExplanation: '',
      productId: '',
      modalTitle: '',
      modalButtonText: '',
      modalButtonUrl: ''
    };

    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber === dayNumber) {
          if (sessionId) {
            return {
              ...day,
              sessions: day.sessions.map(session => {
                if (session.id === sessionId) {
                  return {
                    ...session,
                    tasks: [...session.tasks, newTask]
                  };
                }
                return session;
              })
            };
          } else {
            return {
              ...day,
              tasks: [...day.tasks, newTask]
            };
          }
        }
        return day;
      })
    }));
  };

  const removeTask = (dayNumber: number, taskId: string, sessionId?: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber === dayNumber) {
          if (sessionId) {
            // Remove task from session
            return {
              ...day,
              sessions: day.sessions.map(session => {
                if (session.id === sessionId) {
                  return {
                    ...session,
                    tasks: session.tasks.filter(task => task.id !== taskId)
                  };
                }
                return session;
              })
            };
          } else {
            // Remove task from day
            return {
              ...day,
              tasks: day.tasks.filter(task => task.id !== taskId)
            };
          }
        }
        return day;
      })
    }));
  };

  const reorderTasks = (dayNumber: number, sessionId: string, oldIndex: number, newIndex: number) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber === dayNumber) {
          return {
            ...day,
            sessions: day.sessions.map(session => {
              if (session.id === sessionId) {
                const newTasks = [...session.tasks];
                const [reorderedTask] = newTasks.splice(oldIndex, 1);
                newTasks.splice(newIndex, 0, reorderedTask);
                
                // Update order property for all tasks
                const updatedTasks = newTasks.map((task, index) => ({
                  ...task,
                  order: index + 1
                }));
                
                return {
                  ...session,
                  tasks: updatedTasks
                };
              }
              return session;
            })
          };
        }
        return day;
      })
    }));
  };

  const updateTask = useCallback((dayNumber: number, taskId: string, field: string, value: string | boolean, sessionId?: string) => {
    setProtocol(prev => {
      // Find the day index first to avoid unnecessary iterations
      const dayIndex = prev.days.findIndex(day => day.dayNumber === dayNumber);
      if (dayIndex === -1) return prev;

      const day = prev.days[dayIndex];
      
      if (sessionId) {
        // Update task in session
        const sessionIndex = day.sessions.findIndex(session => session.id === sessionId);
        if (sessionIndex === -1) return prev;

        const session = day.sessions[sessionIndex];
        const taskIndex = session.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return prev;

        // Only update if the value actually changed
        if (session.tasks[taskIndex][field as keyof ProtocolTask] === value) return prev;

        // Create new arrays only for the parts that changed
        const newTasks = [...session.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], [field]: value };

        const newSessions = [...day.sessions];
        newSessions[sessionIndex] = { ...newSessions[sessionIndex], tasks: newTasks };

        const newDays = [...prev.days];
        newDays[dayIndex] = { ...day, sessions: newSessions };

        return { ...prev, days: newDays };
      } else {
        // Update task in day
        const taskIndex = day.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return prev;

        // Only update if the value actually changed
        if (day.tasks[taskIndex][field as keyof ProtocolTask] === value) return prev;

        // Create new arrays only for the parts that changed
        const newTasks = [...day.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], [field]: value };

        const newDays = [...prev.days];
        newDays[dayIndex] = { ...day, tasks: newTasks };

        return { ...prev, days: newDays };
      }
    });
  }, []);

  const addSession = (dayNumber: number) => {
    const newSession: ProtocolSession = {
      id: `temp-session-${Date.now()}`,
      name: '',
      order: 0,
      tasks: []
    };

    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber === dayNumber) {
          return {
            ...day,
            sessions: [...day.sessions, newSession]
          };
        }
        return day;
      })
    }));
  };

  const removeSession = (dayNumber: number, sessionId: string) => {
    console.log('🗑️ Removing session:', { dayNumber, sessionId });
    setProtocol(prev => {
      const newProtocol = {
        ...prev,
        days: prev.days.map(day => {
          if (day.dayNumber === dayNumber) {
            const newDay = {
              ...day,
              sessions: day.sessions.filter(session => session.id !== sessionId)
            };
            console.log('🗑️ Day after removing session:', { 
              dayNumber: newDay.dayNumber, 
              sessionsCount: newDay.sessions.length,
              sessionIds: newDay.sessions.map(s => s.id)
            });
            return newDay;
          }
          return day;
        })
      };
      console.log('🗑️ Protocol after removing session:', {
        daysCount: newProtocol.days.length,
        day1SessionsCount: newProtocol.days.find(d => d.dayNumber === 1)?.sessions.length || 0
      });
      return newProtocol;
    });
  };

  const updateSession = useCallback((dayNumber: number, sessionId: string, field: string, value: string) => {
    console.log('✏️ Updating session:', { dayNumber, sessionId, field, value });
    setProtocol(prev => {
      // Find the day index first to avoid unnecessary iterations
      const dayIndex = prev.days.findIndex(day => day.dayNumber === dayNumber);
      if (dayIndex === -1) return prev;

      const day = prev.days[dayIndex];
      const sessionIndex = day.sessions.findIndex(session => session.id === sessionId);
      if (sessionIndex === -1) return prev;

      const session = day.sessions[sessionIndex];
      
      // Only update if the value actually changed
      if (session[field as keyof ProtocolSession] === value) return prev;

      // Create new arrays only for the parts that changed
      const newSessions = [...day.sessions];
      newSessions[sessionIndex] = { ...session, [field]: value };

      const newDays = [...prev.days];
      newDays[dayIndex] = { ...day, sessions: newSessions };

      console.log('✏️ Session updated:', { 
        sessionId, 
        field, 
        oldValue: session[field as keyof ProtocolSession], 
        newValue: value 
      });

      return { ...prev, days: newDays };
    });
  }, []);

  const addProduct = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;

    const newProtocolProduct: ProtocolProduct = {
      id: `temp-product-${Date.now()}`,
      productId: productId,
      order: protocol.products.length + 1,
      isRequired: false,
      notes: '',
      product: product
    };

    setProtocol(prev => ({
      ...prev,
      products: [...prev.products, newProtocolProduct]
    }));
  };

  const removeProduct = (protocolProductId: string) => {
    setProtocol(prev => ({
      ...prev,
      products: prev.products.filter(pp => pp.id !== protocolProductId)
    }));
  };

  const updateProtocolProduct = useCallback((protocolProductId: string, field: string, value: any) => {
    setProtocol(prev => {
      const productIndex = prev.products.findIndex(pp => pp.id === protocolProductId);
      if (productIndex === -1) return prev;

      const product = prev.products[productIndex];
      
      // Only update if the value actually changed
      if (product[field as keyof ProtocolProduct] === value) return prev;

      // Create new array only for the part that changed
      const newProducts = [...prev.products];
      newProducts[productIndex] = { ...product, [field]: value };

      return { ...prev, products: newProducts };
    });
  }, []);

  const saveProtocol = async () => {
    try {
      setIsLoading(true);
      setShowSuccessAlert(false);
      setShowErrorAlert(false);
      setErrorMessage('');
      
      console.log('💾 Saving protocol...');
      console.log('📋 Protocol data to save:', {
        name: protocol.name,
        duration: protocol.duration,
        daysCount: protocol.days.length,
        productsCount: protocol.products.length,
        onboardingTemplateId: protocol.onboardingTemplateId
      });

      // Detailed session logs before sending
      protocol.days.forEach((day, dayIndex) => {
        console.log(`📅 Day ${day.dayNumber}:`, {
          sessionsCount: day.sessions.length,
          tasksCount: day.tasks.length
        });
        day.sessions.forEach((session, sessionIndex) => {
          console.log(`  📝 Session ${sessionIndex + 1}:`, {
            id: session.id,
            name: session.name,
            order: session.order,
            tasksCount: session.tasks.length
          });
        });
      });
      
      const response = await fetch(`/api/protocols/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: protocol.name,
          description: protocol.description,
          isTemplate: protocol.isTemplate,
          showDoctorInfo: protocol.showDoctorInfo,
          modalTitle: protocol.modalTitle,
          modalVideoUrl: protocol.modalVideoUrl,
          modalDescription: protocol.modalDescription,
          modalButtonText: protocol.modalButtonText,
          modalButtonUrl: protocol.modalButtonUrl,
          coverImage: protocol.coverImage,
          consultation_date: protocol.consultation_date,
          onboardingTemplateId: protocol.onboardingTemplateId,
          days: protocol.days.map(day => ({
            dayNumber: day.dayNumber,
            title: day.title || `Day ${day.dayNumber}`,
            sessions: day.sessions.map((session, sessionIndex) => ({
              name: session.name,
              order: sessionIndex,
              tasks: session.tasks.filter(task => task.title.trim()).map((task, index) => ({
                title: task.title,
                order: index,
                hasMoreInfo: task.hasMoreInfo || false,
                videoUrl: task.videoUrl || '',
                fullExplanation: task.fullExplanation || '',
                productId: task.productId || null,
                modalTitle: task.modalTitle || '',
                modalButtonText: task.modalButtonText || '',
                modalButtonUrl: task.modalButtonUrl || ''
              }))
            })),
            tasks: [] // No more direct tasks
          }))
        }),
      });

      console.log('📡 Save protocol API response status:', response.status);
      console.log('📡 Save protocol API response ok:', response.ok);

      if (response.ok) {
        console.log('✅ Protocol saved successfully');
        
        // Save products
        const productsResponse = await fetch(`/api/protocols/${params.id}/products`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            products: protocol.products.map(pp => ({
              productId: pp.productId,
              order: pp.order,
              isRequired: pp.isRequired,
              notes: pp.notes || ''
            }))
          }),
        });

        console.log('📡 Save products API response status:', productsResponse.status);
        console.log('📡 Save products API response ok:', productsResponse.ok);

        if (productsResponse.ok) {
          console.log('✅ Products saved successfully');
          setShowSuccessAlert(true);
          setTimeout(() => setShowSuccessAlert(false), 5000);
        } else {
          console.error('❌ Failed to save products:', productsResponse.status, productsResponse.statusText);
          const errorText = await productsResponse.text();
          console.error('❌ Error response:', errorText);
          setErrorMessage('Error saving protocol products');
          setShowErrorAlert(true);
          setTimeout(() => setShowErrorAlert(false), 5000);
        }
      } else {
        console.error('❌ Failed to save protocol:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        setErrorMessage('Error saving protocol');
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 5000);
      }
    } catch (error) {
      console.error('❌ Error saving protocol:', error);
      setErrorMessage('Unexpected error saving protocol');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Computed values
  const totalTasks = protocol.days.reduce((total, day) => {
    const sessionTasks = day.sessions.reduce((sessionTotal, session) => 
      sessionTotal + session.tasks.length, 0);
    return total + sessionTasks;
  }, 0);

  const availableProductsToAdd = availableProducts.filter(product => 
    !protocol.products.some(pp => pp.productId === product.id)
  );

  // Optimized update functions for main protocol fields
  const updateProtocolField = useCallback((field: keyof ProtocolForm, value: any) => {
    setProtocol(prev => {
      // Only update if the value actually changed
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const updateProductRequired = (protocolProductId: string, isRequired: boolean) => {
    updateProtocolProduct(protocolProductId, 'isRequired', isRequired);
  };

  const updateProductOrder = (protocolProductId: string, order: number) => {
    updateProtocolProduct(protocolProductId, 'order', order);
  };

  const updateProductNotes = (protocolProductId: string, notes: string) => {
    updateProtocolProduct(protocolProductId, 'notes', notes);
  };

  const addDay = () => {
    const newDayNumber = protocol.days.length > 0 
      ? Math.max(...protocol.days.map(d => d.dayNumber)) + 1 
      : 1;
    
    const newDay: ProtocolDay = {
      id: `temp-day-${Date.now()}`,
      dayNumber: newDayNumber,
      title: `Day ${newDayNumber}`,
      sessions: [],
      tasks: []
    };

    setProtocol(prev => ({
      ...prev,
      days: [...prev.days, newDay],
      duration: prev.days.length + 1 // Update duration automatically
    }));
  };

  const removeDay = (dayNumber: number) => {
    setProtocol(prev => {
      const newDays = prev.days.filter(d => d.dayNumber !== dayNumber);
      // Reorder day numbers
      const reorderedDays = newDays.map((day, index) => ({
        ...day,
        dayNumber: index + 1
      }));
      
      return {
        ...prev,
        days: reorderedDays,
        duration: reorderedDays.length
      };
    });
  };

  const duplicateDay = (dayNumber: number) => {
    const dayToDuplicate = protocol.days.find(d => d.dayNumber === dayNumber);
    if (!dayToDuplicate) return;

    const newDayNumber = Math.max(...protocol.days.map(d => d.dayNumber)) + 1;
    
    const duplicatedDay: ProtocolDay = {
      id: `temp-day-${Date.now()}`,
      dayNumber: newDayNumber,
      title: dayToDuplicate.title || `Day ${newDayNumber}`,
      sessions: dayToDuplicate.sessions.map(session => ({
        id: `temp-session-${Date.now()}-${Math.random()}`,
        name: session.name,
        order: session.order,
        tasks: session.tasks.map(task => ({
          id: `temp-task-${Date.now()}-${Math.random()}`,
          title: task.title,
          order: task.order,
          hasMoreInfo: task.hasMoreInfo,
          videoUrl: task.videoUrl,
          fullExplanation: task.fullExplanation,
          productId: task.productId,
          modalTitle: task.modalTitle,
          modalButtonText: task.modalButtonText,
          modalButtonUrl: task.modalButtonUrl
        }))
      })),
      tasks: [] // No more direct tasks
    };

    setProtocol(prev => ({
      ...prev,
      days: [...prev.days, duplicatedDay],
      duration: prev.days.length + 1
    }));

    // Show success notification
    setShowDuplicateSuccessAlert(true);
    setTimeout(() => setShowDuplicateSuccessAlert(false), 3000);
  };

  const updateDay = (dayNumber: number, field: string, value: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? { ...day, [field]: value }
          : day
      )
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file');
      setShowErrorAlert(true);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB');
      setShowErrorAlert(true);
      return;
    }

    try {
      setIsUploadingImage(true);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        updateProtocolField('coverImage', url);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to upload image');
        setShowErrorAlert(true);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrorMessage('Error uploading image');
      setShowErrorAlert(true);
    } finally {
      setIsUploadingImage(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const removeCoverImage = () => {
    setProtocol(prev => ({ ...prev, coverImage: '' }));
  };

  const improveNameWithAI = async () => {
    if (!protocol.name.trim()) {
      alert('Please write something in the protocol name before using AI to improve it.');
      return;
    }

    try {
      setIsImprovingName(true);
      
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: protocol.name,
          context: 'protocol_name'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProtocol(prev => ({ ...prev, name: data.improvedText }));
        setShowAISuccessAlert(true);
        setAiSuccessMessage('Protocol name improved successfully with AI!');
        setTimeout(() => setShowAISuccessAlert(false), 3000);
      } else {
        const errorData = await response.json();
        alert(`Error improving text: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error improving protocol name:', error);
      alert('Connection error while trying to improve text with AI.');
    } finally {
      setIsImprovingName(false);
    }
  };

  const improveDescriptionWithAI = async () => {
    if (!protocol.description.trim()) {
      alert('Please write something in the protocol description before using AI to improve it.');
      return;
    }

    try {
      setIsImprovingDescription(true);
      
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: protocol.description,
          context: 'protocol_description'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProtocol(prev => ({ ...prev, description: data.improvedText }));
        setShowAISuccessAlert(true);
        setAiSuccessMessage('Protocol description improved successfully with AI!');
        setTimeout(() => setShowAISuccessAlert(false), 3000);
      } else {
        const errorData = await response.json();
        alert(`Error improving text: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error improving protocol description:', error);
      alert('Connection error while trying to improve text with AI.');
    } finally {
      setIsImprovingDescription(false);
    }
  };

  // Computed property to check if modal is enabled (has any content)
  const isModalEnabled = !!(protocol.modalTitle || protocol.modalVideoUrl || protocol.modalDescription);

  // Function to toggle modal enabled state
  const toggleModalEnabled = (enabled: boolean) => {
    if (!enabled) {
      // Clear all modal fields when disabling
      setProtocol(prev => ({
        ...prev,
        modalTitle: '',
        modalVideoUrl: '',
        modalDescription: '',
        modalButtonText: '',
        modalButtonUrl: ''
      }));
    } else {
      // Set default title when enabling
      setProtocol(prev => ({
        ...prev,
        modalTitle: prev.modalTitle || 'Protocol Information'
      }));
    }
  };

  const reorderSessions = (dayNumber: number, oldIndex: number, newIndex: number) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber === dayNumber) {
          const newSessions = [...day.sessions];
          const [reorderedSession] = newSessions.splice(oldIndex, 1);
          newSessions.splice(newIndex, 0, reorderedSession);
          
          // Update order property for all sessions
          const updatedSessions = newSessions.map((session, index) => ({
            ...session,
            order: index + 1
          }));
          
          return {
            ...day,
            sessions: updatedSessions
          };
        }
        return day;
      })
    }));
  };

  if (isLoadingProtocol) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8">
            {/* Header Skeleton */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="flex-1">
                <div className="w-64 h-8 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-24 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>

            {/* Tabs Skeleton */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6">
              <div className="grid grid-cols-5 gap-2 bg-gray-100 rounded-xl p-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                <div className="space-y-4">
                  <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Indicator */}
            <div className="fixed bottom-8 right-8 bg-white border border-gray-200 shadow-lg rounded-2xl p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5154e7] border-t-transparent"></div>
              <span className="text-gray-700 font-medium">Loading protocol...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8 space-y-8">
        
          {/* Header */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-3">
              <Link href={`/doctor/protocols/${params.id}`}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Protocol
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 font-medium">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>{protocol.duration} days</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>{totalTasks} tasks</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <ShoppingBagIcon className="h-4 w-4" />
                  <span>{protocol.products.length} products</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={saveProtocol} 
              disabled={isLoading}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>

          {/* Success Alert */}
          {showSuccessAlert && (
            <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-900">Protocol saved successfully!</h4>
                  <p className="text-xs text-green-700 mt-1">All changes have been saved.</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {showErrorAlert && (
            <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XMarkIcon className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900">Error saving</h4>
                  <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowErrorAlert(false)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-100 rounded-lg h-6 w-6 p-0"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* AI Success Alert */}
          {showAISuccessAlert && (
            <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-purple-900">AI Improvement Complete!</h4>
                  <p className="text-xs text-purple-700 mt-1">Text has been enhanced successfully</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAISuccessAlert(false)}
                  className="text-purple-500 hover:text-purple-600 hover:bg-purple-100 rounded-lg h-6 w-6 p-0"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Duplicate Day Success Alert */}
          {showDuplicateSuccessAlert && (
            <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                  <DocumentDuplicateIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-900">Day Duplicated Successfully!</h4>
                  <p className="text-xs text-green-700 mt-1">All sessions and tasks have been copied</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDuplicateSuccessAlert(false)}
                  className="text-green-500 hover:text-green-600 hover:bg-green-100 rounded-lg h-6 w-6 p-0"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Tabs Interface */}
          <ProtocolEditTabs
            protocol={protocol}
            setProtocol={setProtocol}
            availableProducts={availableProducts}
            availableProductsToAdd={availableProductsToAdd}
            addProduct={addProduct}
            removeProduct={removeProduct}
            updateProtocolProduct={updateProtocolProduct}
            protocolId={params.id as string}
          >
            {{
              basicInfo: (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-900 font-semibold">Protocol Name</Label>
                          <div className="relative">
                            <Input
                              id="name"
                              value={protocol.name}
                              onChange={(e) => updateProtocolField('name', e.target.value)}
                              placeholder="Ex: Post-Facial Filler"
                              className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 pr-12"
                            />
                            {protocol.name.trim() && (
                              <button
                                type="button"
                                onClick={improveNameWithAI}
                                disabled={isImprovingName}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#5154e7] hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Improve text with AI"
                              >
                                {isImprovingName ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5154e7] border-t-transparent"></div>
                                ) : (
                                  <SparklesIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-gray-900 font-semibold">Description</Label>
                          <div className="relative">
                            <Textarea
                              id="description"
                              value={protocol.description}
                              onChange={(e) => updateProtocolField('description', e.target.value)}
                              placeholder="Describe the protocol..."
                              rows={4}
                              className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                            />
                          </div>
                        </div>

                        <ConsultationDatePicker
                          consultationDate={protocol.consultation_date ? new Date(protocol.consultation_date) : null}
                          onDateChange={(date) => updateProtocolField('consultation_date', date?.toISOString() || null)}
                        />

                        <div className="space-y-2">
                          <Label htmlFor="onboardingTemplate" className="text-gray-900 font-semibold">Onboarding Template</Label>
                          <Select
                            value={protocol.onboardingTemplateId || 'none'}
                            onValueChange={(value) => updateProtocolField('onboardingTemplateId', value === 'none' ? null : value)}
                          >
                            <SelectTrigger className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12">
                              <SelectValue placeholder="Select an onboarding template..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No template</SelectItem>
                              {availableOnboardingTemplates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            Select a template that patients will need to fill out before their consultation.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="isTemplate"
                              checked={protocol.isTemplate}
                              onChange={(e) => updateProtocolField('isTemplate', e.target.checked)}
                              className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                            />
                            <Label htmlFor="isTemplate" className="text-gray-900 font-medium">
                              Save as template
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="showDoctorInfo"
                              checked={protocol.showDoctorInfo}
                              onChange={(e) => updateProtocolField('showDoctorInfo', e.target.checked)}
                              className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                            />
                            <Label htmlFor="showDoctorInfo" className="text-gray-900 font-medium">
                              Show responsible doctor
                            </Label>
                            <span className="text-xs text-gray-500">
                              (Shows your photo and name on patient screen)
                            </span>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="flex items-start gap-3">
                            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                Day Management
                              </p>
                              <p className="text-xs text-blue-700">
                                The protocol duration is automatically determined by the days you add in the "Schedule" tab. 
                                Currently: <strong>{protocol.days.length} {protocol.days.length === 1 ? 'day' : 'days'}</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),

              modalConfig: (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Modal Configuration (Optional)</CardTitle>
                    <p className="text-gray-600 font-medium">
                      Configure an optional modal that will be displayed when this protocol is unavailable or inactive for patients. If disabled, the protocol will simply not be clickable when unavailable.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Modal Enable/Disable Toggle */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="modalEnabled"
                            checked={isModalEnabled}
                            onChange={(e) => toggleModalEnabled(e.target.checked)}
                            className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7] w-4 h-4"
                          />
                          <Label htmlFor="modalEnabled" className="text-gray-900 font-semibold">
                            Enable Modal
                          </Label>
                        </div>
                        <Badge 
                          variant={isModalEnabled ? "default" : "secondary"} 
                          className={isModalEnabled 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : "bg-gray-100 text-gray-600 border-gray-200"
                          }
                        >
                          {isModalEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 ml-7">
                        {isModalEnabled 
                          ? 'Modal will be shown when protocol is unavailable or inactive'
                          : 'Protocol will not be clickable when unavailable or inactive'
                        }
                      </p>
                    </div>

                    {/* Modal Configuration Fields - Only show when enabled */}
                    {isModalEnabled && (
                      <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="modalTitle" className="text-gray-900 font-semibold">Modal Title</Label>
                            <Input
                              id="modalTitle"
                              value={protocol.modalTitle}
                              onChange={(e) => updateProtocolField('modalTitle', e.target.value)}
                              placeholder="Ex: Protocol in Development"
                              className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="modalVideoUrl" className="text-gray-900 font-semibold">Video URL (optional)</Label>
                            <Input
                              id="modalVideoUrl"
                              value={protocol.modalVideoUrl}
                              onChange={(e) => updateProtocolField('modalVideoUrl', e.target.value)}
                              placeholder="Ex: https://www.youtube.com/embed/..."
                              className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="modalDescription" className="text-gray-900 font-semibold">Modal Description</Label>
                            <Textarea
                              id="modalDescription"
                              value={protocol.modalDescription}
                              onChange={(e) => updateProtocolField('modalDescription', e.target.value)}
                              placeholder="Describe what will be shown in the modal..."
                              className="min-h-[80px] border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="modalButtonText" className="text-gray-900 font-semibold">Button Text</Label>
                              <Input
                                id="modalButtonText"
                                value={protocol.modalButtonText}
                                onChange={(e) => updateProtocolField('modalButtonText', e.target.value)}
                                placeholder="Ex: Learn more"
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="modalButtonUrl" className="text-gray-900 font-semibold">Button URL (optional)</Label>
                              <Input
                                id="modalButtonUrl"
                                value={protocol.modalButtonUrl}
                                onChange={(e) => updateProtocolField('modalButtonUrl', e.target.value)}
                                placeholder="Ex: https://..."
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Disabled State Message */}
                    {!isModalEnabled && (
                      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Modal Disabled</h3>
                        <p className="text-xs text-gray-500">
                          Enable the modal above to configure its content and behavior.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ),

              products: (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">Protocol Products</CardTitle>
                        <p className="text-gray-600 font-medium mt-1">
                          Add products that will be recommended to patients in this protocol.
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-[#5154e7] text-white border-[#5154e7] font-semibold">
                        {protocol.products.length} products
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Add Product */}
                    {availableProductsToAdd.length > 0 ? (
                      <div className="space-y-3">
                        <Label className="text-gray-900 font-semibold">Add Product</Label>
                        <div className="flex gap-3">
                          <Select onValueChange={addProduct}>
                            <SelectTrigger className="flex-1 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 rounded-xl h-12">
                              <SelectValue placeholder="Select a product..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProductsToAdd.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{product.name}</span>
                                    {product.brand && (
                                      <span className="text-xs text-gray-500">({product.brand})</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-600 text-center font-medium">
                          {availableProducts.length === 0 
                            ? 'Loading products...' 
                            : 'All available products have already been added to the protocol.'
                          }
                        </p>
                      </div>
                    )}

                    {/* Products List */}
                    {protocol.products.length > 0 && (
                      <div className="space-y-4">
                        {protocol.products.map((protocolProduct, index) => (
                          <div key={protocolProduct.id} className="border border-gray-200 rounded-xl bg-gray-50">
                            <div className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-gray-900">{protocolProduct.product.name}</h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeProduct(protocolProduct.id)}
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  {protocolProduct.product.description && (
                                    <p className="text-gray-600 text-sm">{protocolProduct.product.description}</p>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        id={`required-${protocolProduct.id}`}
                                        checked={protocolProduct.isRequired}
                                        onChange={(e) => updateProductRequired(protocolProduct.id, e.target.checked)}
                                        className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                                      />
                                      <Label htmlFor={`required-${protocolProduct.id}`} className="text-gray-900 font-medium">
                                        Required product
                                      </Label>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label className="text-gray-900 font-semibold">Order</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={protocolProduct.order}
                                        onChange={(e) => updateProductOrder(protocolProduct.id, parseInt(e.target.value) || 1)}
                                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 rounded-xl h-10"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-gray-900 font-semibold">Notes (optional)</Label>
                                    <Textarea
                                      value={protocolProduct.notes || ''}
                                      onChange={(e) => updateProductNotes(protocolProduct.id, e.target.value)}
                                      placeholder="Notes about using this product..."
                                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ),

              days: (
                <ProtocolDayEditor
                  days={protocol.days}
                  availableProducts={availableProducts}
                  addTask={addTask}
                  removeTask={removeTask}
                  updateTask={updateTask}
                  reorderTasks={reorderTasks}
                  reorderSessions={reorderSessions}
                  addSession={addSession}
                  removeSession={removeSession}
                  updateSession={updateSession}
                  addDay={addDay}
                  removeDay={removeDay}
                  duplicateDay={duplicateDay}
                  updateDay={updateDay}
                />
              )
            }}
          </ProtocolEditTabs>
        </div>
      </div>
    </div>
  );
} 