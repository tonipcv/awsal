'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PlayIcon, 
  ShoppingBagIcon, 
  XMarkIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

interface TaskInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string;
    hasMoreInfo?: boolean;
    modalTitle?: string;
    videoUrl?: string;
    fullExplanation?: string;
    modalButtonText?: string;
    product?: {
      id: string;
      name: string;
      description?: string;
      brand?: string;
      imageUrl?: string;
      originalPrice?: number;
      discountPrice?: number;
      purchaseUrl?: string;
    };
  };
  isCompleted?: boolean;
}

export function TaskInfoModal({ isOpen, onClose, task }: TaskInfoModalProps) {
  const modalTitle = task.modalTitle || `Mais sobre: ${task.title}`;
  const buttonText = task.modalButtonText || 'Fechar';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-light text-white">
              {modalTitle}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Vídeo */}
          {task.videoUrl && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PlayIcon className="h-5 w-5 text-[#76e1d8]" />
                <h3 className="text-lg font-medium text-white">Vídeo Explicativo</h3>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden bg-zinc-800">
                <iframe
                  src={task.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title="Vídeo explicativo da tarefa"
                />
              </div>
            </div>
          )}

          {/* Explicação Completa */}
          {task.fullExplanation && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Explicação Detalhada</h3>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {task.fullExplanation}
                </p>
              </div>
            </div>
          )}

          {/* Produto Relacionado */}
          {task.product && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingBagIcon className="h-5 w-5 text-[#76e1d8]" />
                <h3 className="text-lg font-medium text-white">Produto Recomendado</h3>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <div className="flex items-start gap-4">
                  {/* Imagem do Produto */}
                  <div className="w-16 h-16 rounded-lg bg-zinc-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {task.product.imageUrl ? (
                      <img 
                        src={task.product.imageUrl} 
                        alt={task.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-zinc-600 rounded" />
                    )}
                  </div>

                  {/* Info do Produto */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium mb-1">
                      {task.product.name}
                    </h4>
                    {task.product.brand && (
                      <p className="text-sm text-zinc-400 mb-2">
                        {task.product.brand}
                      </p>
                    )}
                    {task.product.description && (
                      <p className="text-sm text-zinc-300 mb-3">
                        {task.product.description}
                      </p>
                    )}

                    {/* Preço */}
                    {(task.product.originalPrice || task.product.discountPrice) && (
                      <div className="mb-3">
                        {task.product.discountPrice && task.product.originalPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-[#76e1d8]">
                              R$ {task.product.discountPrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-zinc-500 line-through">
                              R$ {task.product.originalPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-white">
                            R$ {(task.product.originalPrice || task.product.discountPrice)?.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Link de Compra */}
                    {task.product.purchaseUrl && (
                      <Button 
                        size="sm" 
                        className="bg-[#76e1d8] hover:bg-[#5dd4c8] text-white"
                        asChild
                      >
                        <a 
                          href={task.product.purchaseUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          Comprar Produto
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Ação */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={onClose}
              className="bg-zinc-700 hover:bg-zinc-600 text-white"
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 