import { useState } from 'react'
import { ArrowUpRight, FileStack, LayoutDashboard, MapPinned, Menu, Plus, Radio, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useBackendHealth } from '../../hooks/useBackendHealth'
import { API_BASE_URL } from '../../services/api'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload Dataset', icon: Plus },
  { to: '/files', label: 'Files', icon: FileStack },
]

function pageLabel(path: string) {
  if (path === '/') return ['Overview', 'Your geospatial workspace at a glance.']
  if (path === '/upload') return ['Upload dataset', 'Transform raw spatial data into insight.']
  if (path === '/files') return ['Dataset library', 'Every file you have analyzed, in one place.']
  return ['Dataset explorer', 'Inspect the geometry behind every measurement.']
}

