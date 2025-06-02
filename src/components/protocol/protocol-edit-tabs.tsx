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
  EyeIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ProtocolEditTabsProps {
  protocol: any;
  setProtocol: (protocol: any) => void;
  availableProducts: any[];
  availableProductsToAdd: any[];
  addProduct: (productId: string) => void;
  removeProduct: (protocolProductId: string) => void;
  updateProtocolProduct: (protocolProductId: string, field: string, value: any) => void;
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
  children 
}: ProtocolEditTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Calcular estatísticas para o overview
  const totalTasks = protocol.days.reduce((total: number, day: any) => {
    const sessionTasks = day.sessions.reduce((sessionTotal: number, session: any) => 
      sessionTotal + session.tasks.length, 0);
    return total + sessionTasks + day.tasks.length;
  }, 0);

  const totalSessions = protocol.days.reduce((total: number, day: any) => 
    total + day.sessions.length, 0);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100 rounded-xl p-1">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <EyeIcon className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="basic" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <InformationCircleIcon className="h-4 w-4" />
            Básico
          </TabsTrigger>
          <TabsTrigger 
            value="products" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <ShoppingBagIcon className="h-4 w-4" />
            Produtos
            <Badge variant="secondary" className="bg-[#5154e7] text-white text-xs">
              {protocol.products.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="days" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <CalendarDaysIcon className="h-4 w-4" />
            Cronograma
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
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-6">
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <EyeIcon className="h-6 w-6 text-[#5154e7]" />
              Visão Geral do Protocolo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{protocol.duration}</p>
                    <p className="text-sm text-blue-700 font-medium">Dias</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">{totalTasks}</p>
                    <p className="text-sm text-green-700 font-medium">Tarefas</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-900">{totalSessions}</p>
                    <p className="text-sm text-purple-700 font-medium">Sessões</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3">
                  <ShoppingBagIcon className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-900">{protocol.products.length}</p>
                    <p className="text-sm text-orange-700 font-medium">Produtos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo por Dia */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Resumo por Dia</h3>
              <div className="grid gap-3">
                {protocol.days.map((day: any) => {
                  const dayTasks = day.sessions.reduce((total: number, session: any) => 
                    total + session.tasks.length, 0) + day.tasks.length;
                  
                  return (
                    <div key={day.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#5154e7] text-white rounded-full flex items-center justify-center font-bold">
                          {day.dayNumber}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Dia {day.dayNumber}</p>
                          <p className="text-sm text-gray-600">
                            {day.sessions.length} sessões • {dayTasks} tarefas
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('days')}
                        className="text-[#5154e7] border-[#5154e7] hover:bg-[#5154e7] hover:text-white"
                      >
                        Editar
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

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
    </Tabs>
  );
} 