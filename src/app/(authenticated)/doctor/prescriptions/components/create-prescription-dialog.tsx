'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreatePrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Protocol {
  id: string;
  name: string;
}

export function CreatePrescriptionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePrescriptionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  // Using sonner toast for prescriptions
  const [formData, setFormData] = useState({
    protocol_id: '',
    email: '',
    planned_start_date: '',
    planned_end_date: '',
    consultation_date: '',
  });

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const response = await fetch('/api/v2/doctor/protocols');
        const data = await response.json();
        if (data.success) {
          setProtocols(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch protocols', error);
      }
    };
    if (open) {
      fetchProtocols();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v2/doctor/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create prescription');

      toast.success('Prescription created successfully');

      onSuccess();
      onOpenChange(false);
      setFormData({
        protocol_id: '',
        email: '',
        planned_start_date: '',
        planned_end_date: '',
        consultation_date: '',
      });
    } catch (error) {
      toast.error('Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Prescription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="protocol_id">Protocol</Label>
            <Select
              onValueChange={(value) => setFormData({ ...formData, protocol_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a protocol" />
              </SelectTrigger>
              <SelectContent>
                {protocols.map((protocol) => (
                  <SelectItem key={protocol.id} value={protocol.id}>
                    {protocol.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="email">Patient Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="planned_start_date">Start Date</Label>
            <Input
              id="planned_start_date"
              type="date"
              value={formData.planned_start_date}
              onChange={(e) =>
                setFormData({ ...formData, planned_start_date: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="planned_end_date">End Date</Label>
            <Input
              id="planned_end_date"
              type="date"
              value={formData.planned_end_date}
              onChange={(e) =>
                setFormData({ ...formData, planned_end_date: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="consultation_date">Consultation Date</Label>
            <Input
              id="consultation_date"
              type="date"
              value={formData.consultation_date}
              onChange={(e) =>
                setFormData({ ...formData, consultation_date: e.target.value })
              }
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
