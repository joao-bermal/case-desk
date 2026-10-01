'use client';

import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import ExpandMoreTwoToneIcon from '@mui/icons-material/ExpandMoreTwoTone';
import LockOpenTwoToneIcon from '@mui/icons-material/LockOpenTwoTone';
import MenuIcon from '@mui/icons-material/Menu';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import type { Role } from '@/lib/api/client';
import { common, roleLabel } from '@/content/common';
import { SIDEBAR } from '@/theme';

import { Brand } from './common';
import { LanguageSwitch } from './LanguageSwitch';
import { useLocale } from './LocaleProvider';

type NavKey = keyof (typeof common)['pt']['nav'];

const NAV: Record<Role, { href: string; label: NavKey; icon: ReactNode }[]> = {
  secretary: [
    { href: '/cases', label: 'cases', icon: <GavelOutlinedIcon /> },
    { href: '/companies', label: 'companies', icon: <BusinessOutlinedIcon /> },
    { href: '/lawyers', label: 'lawyers', icon: <BadgeOutlinedIcon /> },
  ],
  lawyer: [
    { href: '/cases', label: 'myCases', icon: <GavelOutlinedIcon /> },
    { href: '/companies', label: 'companies', icon: <BusinessOutlinedIcon /> },
  ],
  client: [{ href: '/cases', label: 'companyCases', icon: <GavelOutlinedIcon /> }],
};

function initials(name: string) {
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function AppShell({
  user,
  demoMode,
  repoUrl,
  logout,
  children,
}: {
  user: { full_name: string; email: string; role: Role };
  demoMode: boolean;
  repoUrl: string;
  logout: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = common[locale];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const sidebar = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: SIDEBAR.background, color: SIDEBAR.text }}>
      <Toolbar sx={{ px: 2.5 }}>
        <NextLink href="/cases" aria-label={t.shell.home} style={{ textDecoration: 'none' }}>
          <Brand tone="light" size={30} />
        </NextLink>
      </Toolbar>
      <Typography variant="overline" sx={{ px: 3, pt: 2, color: SIDEBAR.muted, fontWeight: 700 }}>
        {t.nav.office}
      </Typography>
      <List sx={{ px: 1.5 }}>
        {NAV[user.role].map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <ListItemButton
              key={item.href}
              component={NextLink}
              href={item.href}
              selected={active}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: active ? '#fff' : SIDEBAR.text,
                '&:hover': { bgcolor: SIDEBAR.hover },
                '&.Mui-selected, &.Mui-selected:hover': { bgcolor: SIDEBAR.selected },
                '&.Mui-selected::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 8,
                  bottom: 8,
                  width: 3,
                  borderRadius: 2,
                  bgcolor: 'secondary.main',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={t.nav[item.label]} slotProps={{ primary: { sx: { fontWeight: active ? 600 : 500, fontSize: 14 } } }} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2.5 }}>
        <Typography variant="caption" sx={{ color: SIDEBAR.muted, display: 'block', lineHeight: 1.5 }}>
          {t.shell.credit}{' '}
          <Link href={repoUrl} target="_blank" rel="noreferrer" sx={{ color: SIDEBAR.text }}>
            {t.shell.code}
          </Link>
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box component="nav" sx={{ width: { md: SIDEBAR.width }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR.width, border: 0 } }}
        >
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: SIDEBAR.width, border: 0 } }}
        >
          {sidebar}
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }} aria-label={t.shell.openMenu}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Brand size={26} />
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <LanguageSwitch />
            <ButtonBase
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ borderRadius: 2, px: 1, py: 0.5, gap: 1.25, textAlign: 'left' }}
              aria-label={t.shell.accountMenu}
            >
              <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14, fontWeight: 600 }}>
                {initials(user.full_name)}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {user.full_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {roleLabel[locale][user.role]}
                </Typography>
              </Box>
              <ExpandMoreTwoToneIcon fontSize="small" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }} />
            </ButtonBase>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { minWidth: 240, mt: 1 } } }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Avatar variant="rounded" sx={{ bgcolor: 'primary.main', fontWeight: 600 }}>
                  {initials(user.full_name)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {user.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {roleLabel[locale][user.role]} · {user.email}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              {NAV[user.role].map((item) => (
                <MenuItem key={item.href} component={NextLink} href={item.href} onClick={() => setMenuAnchor(null)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  {t.nav[item.label]}
                </MenuItem>
              ))}
              <MenuItem component={NextLink} href="/account" onClick={() => setMenuAnchor(null)}>
                <ListItemIcon>
                  <AccountCircleOutlinedIcon fontSize="small" />
                </ListItemIcon>
                {t.nav.account}
              </MenuItem>
              <Divider />
              <Box component="form" action={logout} sx={{ px: 1, pb: 0.5 }}>
                <Button type="submit" color="error" fullWidth startIcon={<LockOpenTwoToneIcon />}>
                  {t.shell.signOut}
                </Button>
              </Box>
            </Menu>
          </Toolbar>
        </AppBar>

        {demoMode && (
          <Alert severity="warning" variant="standard" sx={{ borderRadius: 0, py: 0.25, '& .MuiAlert-message': { width: '100%' } }}>
            {t.shell.demoBanner}
          </Alert>
        )}

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1440, width: '100%', mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
