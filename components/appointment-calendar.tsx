"use client";

import { useMemo, useState } from "react";
import { createAppointment, deleteAppointment, setAppointmentStatus, updateAppointment } from "@/app/actions/data";
import { ConfirmButton } from "@/components/confirm-button";

type Customer = { id: string; name: string };
type Pet = { id: string; name: string; customer_id: string };
type Employee = { id: string; name: string };
type Service = { id: string; name: string };
type Appt = {
  id: string;
  customer_id: string;
  pet_id: string;
  employee_id: string | null;
  service_id: string | null;
  starts_at: string;
  status: string;
  notes: string;
  customers?: { name: string } | null;
  pets?: { name: string } | null;
  employees?: { name: string } | null;
  services?: { name: string } | null;
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const pad = (value: number) => String(value).padStart(2, "0");

function localValue(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function statusLabel(status: string) {
  return statusLabels[status] ?? status;
}

export function AppointmentCalendar({ appointments, customers, pets, employees, services }: { appointments: Appt[]; customers: Customer[]; pets: Pet[]; employees: Employee[]; services: Service[] }) {
  const [cursor, setCursor] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Appt | null>(null);
  const [customerId, setCustomerId] = useState("");
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const days = Array.from({ length: last.getDate() }, (_, index) => index + 1);
  const grouped = useMemo(() => {
    const result: Record<string, Appt[]> = {};
    appointments.forEach((appointment) => {
      const date = new Date(appointment.starts_at);
      if (date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth()) {
        const key = String(date.getDate());
        (result[key] ??= []).push(appointment);
      }
    });
    Object.values(result).forEach((items) => items.sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
    return result;
  }, [appointments, cursor]);
  const liveStatus = editing ? appointments.find((item) => item.id === editing.id)?.status ?? editing.status : "";
  const formCustomer = editing?.customer_id ?? customerId;
  const allowedPets = pets.filter((pet) => pet.customer_id === formCustomer);

  function openDay(day: number) {
    setEditing(null);
    setCustomerId("");
    setSelected(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(day)}T09:00`);
  }

  function close() {
    setSelected(null);
    setEditing(null);
    setCustomerId("");
  }

  return <>
    <div className="calendar-toolbar">
      <button className="btn ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>←</button>
      <h2>{cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h2>
      <button className="btn ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>→</button>
    </div>
    <div className="calendar-weekdays">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <b key={day}>{day}</b>)}</div>
    <div className="calendar-grid">
      {Array.from({ length: first.getDay() }).map((_, index) => <div key={`b${index}`} className="calendar-day is-empty" />)}
      {days.map((day) => <button type="button" className="calendar-day" key={day} onClick={() => openDay(day)}>
        <span className="calendar-day-number">{day}</span>
        <div className="calendar-events">{(grouped[String(day)] ?? []).slice(0, 4).map((appointment) => <span key={appointment.id} onClick={(event) => { event.stopPropagation(); setEditing(appointment); setSelected(localValue(appointment.starts_at)); setCustomerId(appointment.customer_id); }}>
          <b>{new Date(appointment.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</b> {appointment.pets?.name} <small>{statusLabel(appointment.status)}</small>
        </span>)}</div>
      </button>)}
    </div>
    {(selected || editing) && <div className="modal-backdrop" onMouseDown={close}>
      <div className="card modal-card" onMouseDown={(event) => event.stopPropagation()}>
        <div className="page-head"><div><h2>{editing ? "Editar agendamento" : "Novo agendamento"}</h2><p className="muted">Tutor e pet são validados também no servidor e no banco.</p></div><button className="btn ghost" type="button" onClick={close}>Fechar</button></div>
        {editing && <div className="appointment-actions">
          <span className={`badge status-${liveStatus.toLowerCase()}`}>{statusLabel(liveStatus)}</span>
          <form action={setAppointmentStatus}>
            <input type="hidden" name="id" value={editing.id} />
            <input type="hidden" name="status" value="COMPLETED" />
            <button className="btn" type="submit" disabled={liveStatus === "COMPLETED"}>✓ Marcar como concluído</button>
          </form>
          <form action={setAppointmentStatus}>
            <input type="hidden" name="id" value={editing.id} />
            <input type="hidden" name="status" value="SCHEDULED" />
            <button className="btn secondary" type="submit" disabled={liveStatus !== "COMPLETED"}>↺ Desmarcar</button>
          </form>
          <form action={deleteAppointment}>
            <input type="hidden" name="id" value={editing.id} />
            <ConfirmButton message="Excluir este agendamento? Esta ação não pode ser desfeita.">Excluir</ConfirmButton>
          </form>
        </div>}
        <form className="form" action={editing ? updateAppointment : createAppointment}>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <input type="hidden" name="timezoneOffset" value={String(new Date().getTimezoneOffset())} />
          <div className="grid two">
            <div className="field"><label>Data e horário</label><input name="startsAt" type="datetime-local" defaultValue={editing ? localValue(editing.starts_at) : selected ?? ""} required /></div>
            <div className="field"><label>Tutor</label><select name="customerId" value={formCustomer} onChange={(event) => { setEditing(editing ? { ...editing, customer_id: event.target.value, pet_id: "" } : null); setCustomerId(event.target.value); }} required><option value="">Selecione</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></div>
            <div className="field"><label>Pet</label><select name="petId" defaultValue={editing?.pet_id ?? ""} key={`${formCustomer}-${editing?.pet_id ?? ""}`} required><option value="">Selecione</option>{allowedPets.map((pet) => <option value={pet.id} key={pet.id}>{pet.name}</option>)}</select></div>
            <div className="field"><label>Funcionário</label><select name="employeeId" defaultValue={editing?.employee_id ?? ""}><option value="">Não definido</option>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></div>
            <div className="field"><label>Serviço</label><select name="serviceId" defaultValue={editing?.service_id ?? ""}><option value="">Não definido</option>{services.map((service) => <option value={service.id} key={service.id}>{service.name}</option>)}</select></div>
            {editing && <div className="field"><label>Status</label><select name="status" defaultValue={liveStatus} key={liveStatus}><option value="SCHEDULED">Agendado</option><option value="CONFIRMED">Confirmado</option><option value="COMPLETED">Concluído</option><option value="CANCELLED">Cancelado</option></select></div>}
          </div>
          <div className="field"><label>Observações</label><textarea name="notes" defaultValue={editing?.notes ?? ""} /> </div>
          <button className="btn" type="submit">Salvar agendamento</button>
        </form>
      </div>
    </div>}
  </>;
}
