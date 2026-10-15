import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext.jsx';
import { useToast } from './SnackbarProvider.jsx';
import { EXPENSE_CATEGORIES, TODAY } from '../utils/format';

export default function ExpenseDialog({ open, onClose, expense, defaultEventId }) {
  const { state, dispatch } = useApp();
  const notify = useToast();
  const blank = {
    eventId: defaultEventId || state.events[0]?.id || '', category: 'Fabrication', vendorId: '', description: '', amount: 0,
    date: TODAY.format('YYYY-MM-DD'), status: 'Pending', invoiceNo: '', paymentMode: 'NEFT',
  };
  const [form, setForm] = useState(blank);
  useEffect(() => { setForm(expense ? { ...blank, ...expense } : blank); }, [expense, open]); // eslint-disable-line
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return notify('Enter a valid amount', 'error');
    const item = { ...form, amount, vendorId: form.vendorId || null };
    if (expense?.id) {
      dispatch({ type: 'UPDATE', entity: 'expenses', id: expense.id, patch: item });
      notify('Expense updated');
    } else {
      dispatch({ type: 'ADD', entity: 'expenses', item });
      notify('Expense recorded');
    }
    // keep event.spent in sync
    const ev = state.events.find((e) => e.id === item.eventId);
    if (ev) {
      const others = state.expenses.filter((x) => x.eventId === ev.id && x.id !== expense?.id).reduce((s, x) => s + x.amount, 0);
      dispatch({ type: 'UPDATE', entity: 'events', id: ev.id, patch: { spent: others + amount } });
    }
    onClose();
  };

  const vendorsForCat = state.vendors.filter((v) => v.category === form.category);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{expense?.id ? 'Edit expense' : 'Record expense'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField select label="Project" value={form.eventId} onChange={set('eventId')} fullWidth disabled={!!defaultEventId}>
              {state.events.map((e) => <MenuItem key={e.id} value={e.id}>{e.title}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Category" value={form.category} onChange={set('category')} fullWidth>
              {EXPENSE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Vendor" value={form.vendorId || ''} onChange={set('vendorId')} fullWidth>
              <MenuItem value="">— None —</MenuItem>
              {(vendorsForCat.length ? vendorsForCat : state.vendors).map((v) => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}><TextField label="Description" value={form.description} onChange={set('description')} fullWidth /></Grid>
          <Grid item xs={6}><TextField label="Amount (₹)" type="number" value={form.amount} onChange={set('amount')} fullWidth /></Grid>
          <Grid item xs={6}>
            <DatePicker label="Date" value={dayjs(form.date)} onChange={(v) => v && setForm((f) => ({ ...f, date: v.format('YYYY-MM-DD') }))} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
          </Grid>
          <Grid item xs={4}>
            <TextField select label="Status" value={form.status} onChange={set('status')} fullWidth>
              {['Paid', 'Pending', 'Overdue'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField select label="Mode" value={form.paymentMode} onChange={set('paymentMode')} fullWidth>
              {['NEFT', 'RTGS', 'UPI', 'Cheque', 'Cash'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={4}><TextField label="Invoice no." value={form.invoiceNo} onChange={set('invoiceNo')} fullWidth /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>{expense?.id ? 'Save' : 'Record'}</Button>
      </DialogActions>
    </Dialog>
  );
}
