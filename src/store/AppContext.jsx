import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import clients from '../data/clients.json';
import venues from '../data/venues.json';
import vendors from '../data/vendors.json';
import team from '../data/team.json';
import events from '../data/events.json';
import tasks from '../data/tasks.json';
import expenses from '../data/expenses.json';
import inventory from '../data/inventory.json';
import notifications from '../data/notifications.json';
import leads from '../data/leads.json';

const STORAGE_KEY = 'nanya-event-manager-v1';
const DATA_VERSION = 3;

export const seedState = {
  version: DATA_VERSION,
  auth: { isAuthenticated: false, user: null },
  settings: {
    themeMode: 'light',
    density: 'comfortable',
    currency: 'INR',
    companyName: 'JD EVENTS Design Studio',
    sidebarCollapsed: false,
    notificationsEnabled: true,
  },
  clients,
  venues,
  vendors,
  team,
  events,
  tasks,
  expenses,
  inventory,
  notifications,
  leads,
};

function nextId(prefix, list, width = 3) {
  const max = list.reduce((m, x) => {
    const n = parseInt(String(x.id).split('-').pop(), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(width, '0')}`;
}

const prefixes = {
  clients: ['CL', 3], venues: ['VN', 3], vendors: ['VD', 3], team: ['TM', 3],
  events: ['EV', 3], tasks: ['TK', 4], expenses: ['EX', 4], inventory: ['IN', 3],
  notifications: ['NT', 3], leads: ['LD', 3],
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, auth: { isAuthenticated: true, user: action.user } };
    case 'LOGOUT':
      return { ...state, auth: { isAuthenticated: false, user: null } };
    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'ADD': {
      const [prefix, width] = prefixes[action.entity];
      const item = { ...action.item, id: action.item.id || nextId(prefix, state[action.entity], width) };
      return { ...state, [action.entity]: [item, ...state[action.entity]] };
    }
    case 'UPDATE':
      return {
        ...state,
        [action.entity]: state[action.entity].map((x) => (x.id === action.id ? { ...x, ...action.patch } : x)),
      };
    case 'REMOVE': {
      const next = { ...state, [action.entity]: state[action.entity].filter((x) => x.id !== action.id) };
      if (action.entity === 'events') {
        next.tasks = state.tasks.filter((t) => t.eventId !== action.id);
        next.expenses = state.expenses.filter((e) => e.eventId !== action.id);
      }
      return next;
    }
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'RESET_DATA':
      return { ...seedState, auth: state.auth, settings: state.settings };
    default:
      return state;
  }
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === DATA_VERSION) return parsed;
    }
  } catch (e) {
    /* ignore corrupted storage */
  }
  return seedState;
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* quota exceeded etc. */
    }
  }, [state]);

  const lookups = useMemo(() => {
    const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
    return {
      clientById: byId(state.clients),
      venueById: byId(state.venues),
      vendorById: byId(state.vendors),
      teamById: byId(state.team),
      eventById: byId(state.events),
    };
  }, [state.clients, state.venues, state.vendors, state.team, state.events]);

  const value = useMemo(() => ({ state, dispatch, ...lookups }), [state, lookups]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
