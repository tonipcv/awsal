'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  InformationCircleIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import CheckinQuestionsManager from '@/components/protocol/checkin-questions-manager';

interface ProtocolEditTabsProps {
  protocol: any;
  setProtocol: (protocol: any) => void;
  availableProducts: any[];
  availableProductsToAdd: any[];
  addProduct: (productId: string) => void;
  removeProduct: (protocolProductId: string) => void;
  updateProtocolProduct: (protocolProductId: string, field: string, value: any) => void;
  protocolId?: string;
  children: {
    basicInfo: React.ReactNode;
    modalConfig: React.ReactNode;
    products: React.ReactNode;
    days: React.ReactNode;
  };
}

export function ProtocolEditTabs({ 
  protocol, 
  setProtocol, 
  availableProducts,
  availableProductsToAdd,
  addProduct,
  removeProduct,
  updateProtocolProduct,
  protocolId,
  children 
}: ProtocolEditTabsProps) {
  const [activeTab, setActiveTab] = useState('basic');

  // Check if modal content is configured
  const hasModalContent = protocol.modalTitle || protocol.modalVideoUrl || protocol.modalDescription;
  const isModalEnabled = !!(protocol.modalTitle || protocol.modalVideoUrl || protocol.modalDescription);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100 rounded-xl p-1">
          <TabsTrigger 
            value="basic" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <InformationCircleIcon className="h-4 w-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger 
            value="products" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <ShoppingBagIcon className="h-4 w-4" />
            Products
            <Badge variant="secondary" className="bg-[#5154e7] text-white text-xs">
              {protocol.products.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="days" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <CalendarDaysIcon className="h-4 w-4" />
            Schedule
            <Badge variant="secondary" className="bg-[#5154e7] text-white text-xs">
              {protocol.days.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="modal" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <DocumentTextIcon className="h-4 w-4" />
            Modal
            {isModalEnabled ? (
              <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                ✓
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-400 text-white text-xs">
                Disabled
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="checkin" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            Check-in
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="basic">
        {children.basicInfo}
      </TabsContent>

      <TabsContent value="products">
        {children.products}
      </TabsContent>

      <TabsContent value="days">
        {children.days}
      </TabsContent>

      <TabsContent value="modal">
        {children.modalConfig}
      </TabsContent>

      <TabsContent value="checkin">
        {protocolId ? (
          <CheckinQuestionsManager protocolId={protocolId} />
        ) : (
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-8">
              <div className="text-center">
                <Cog6ToothIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Protocol ID Required</h3>
                <p className="text-gray-600">Save the protocol first to configure check-in questions.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
} 