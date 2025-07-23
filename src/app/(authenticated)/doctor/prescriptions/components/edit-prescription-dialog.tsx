'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Prescription {
  id: string;
  protocol_id: string;
  protocol_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  prescribed_by: string;
  prescribed_at: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status: 'PRESCRIBED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  current_day: number;
  adherence_rate: number;
}

interface EditPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: Prescription | null;
  onSuccess: () => void;
}

export function EditPrescriptionDialog({
  open,
  onOpenChange,
  prescription,
  onSuccess,
}: EditPrescriptionDialogProps) {
  const [loading, setLoading] = useState(false);
  // Using sonner toast for prescriptions
  const [formData, setFormData] = useState({
    planned_start_date: '',
    planned_end_date: '',
    consultation_date: '',
    status: '',
  });

  useEffect(() => {
    if (prescription) {
      setFormData({
        planned_start_date: prescription.planned_start_date.split('T')[0],
        planned_end_date: prescription.planned_end_date.split('T')[0],
        consultation_date: new Date().toISOString().split('T')[0], // Default to today
        status: prescription.status,
      });
    }
  }, [prescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescription) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/v2/doctor/prescriptions/${prescription.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update prescription');

      toast.success('Prescription updated successfully');

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update prescription');
    } finally {
      setLoading(false);
    }
  };

  if (!prescription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Prescription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Patient</Label>
            <p className="text-sm text-gray-500">
              {prescription.user_name} ({prescription.user_email})
            </p>
          </div>
          <div>
            <Label>Protocol</Label>
            <p className="text-sm text-gray-500">{prescription.protocol_name}</p>
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
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESCRIBED">Prescribed</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
