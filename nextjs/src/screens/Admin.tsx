'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';
import AdminDashboard from './AdminDashboard';
import AdminLive from './AdminLive';
import AdminAttendance from './AdminAttendance';
import AdminLeaveInbox from './AdminLeaveInbox';
import AdminAlerts from './AdminAlerts';
import AdminEmployees from './AdminEmployees';
import AdminBranches from './AdminBranches';
import AdminProfile from './AdminProfile';
import AdminSettings from './AdminSettings';
import AdminAuditLog from './AdminAuditLog';
import AdminUsers from './AdminUsers';
import AdminReports from './AdminReports';
import AdminSchedules from './AdminSchedules';
import AdminOther from './AdminOther';
import AdminDrawer from './AdminDrawer';

const I = {
  dash:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  att:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  plan:'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  leave:'M8 3v4M16 3v4M3 9h18M4 5h16v16H4zM9 15l2 2 4-4',
  sites:'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  emp:'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 19v-1a4 4 0 0 0-3-3.9M16 3.1a3.5 3.5 0 0 1 0 6.8',
  rep:'M4 20V10M10 20V4M16 20v-7M22 20H2',
  access:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  set:'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M14 4v4M8 10v4M16 16v4',
  shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 8v5M12 16h.01',
  logout:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  userx:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 4 1.5M17 15l5 5M22 15l-5 5',
  sun:'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon:'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z',
  live:'M3 12h4l3-8 4 16 3-8h4',
  alert:'M12 3l10 18H2zM12 10v4M12 17h.01',
  audit:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  company:'M3 21h18M5 21V5l7-3v19M19 21V9l-7-3M9 9h.01M9 13h.01M9 17h.01M15 13h.01M15 17h.01',
  branch:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  calx:'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4M10 14l4 4M14 14l-4 4',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a7 7 0 0 1 16 0v1',
  lock:'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  book:'M4 4h6a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h7z',
  kbd:'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  spark:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  chat:'M21 12a8 8 0 0 1-11.8 7L3 21l2-6A8 8 0 1 1 21 12z',
  phone:'M7 2h10v20H7zM11 18h2',
  monitor:'M3 4h18v12H3zM8 21h8M12 16v5',
  colL:'M3 4h18v16H3zM9 4v16M16 10l-2 2 2 2',
  colR:'M3 4h18v16H3zM9 4v16M14 10l2 2-2 2',
  check:'M5 12l5 5L20 7', x:'M18 6L6 18M6 6l12 12', warn:'M12 3l10 18H2zM12 10v4M12 17h.01', clip:'M21 12l-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8'
};
const T = {
  dashboard:['Dashboard','Tableau de bord'], attendance:['Attendance','Présences'], planner:['Planner','Planning'], leave:['Leave requests','Demandes de congé'], leaveNav:['Leave','Congés'],
  sites:['Sites','Sites'], employees:['Employees','Employés'], reports:['Reports','Rapports'], access:['Roles & access','Rôles et accès'], settings:['Settings','Paramètres'],
  gWork:['Operations','Suivi'], gOrg:['Organization','Organisation'], gAdmin:['Administration','Administration'],
  scope:['Scope','Périmètre'], search:['Search employees, sites…','Rechercher employés, sites…'], date:['Thu 15 Oct','jeu. 15 oct.'],
  hello:['Good morning, ','Bonjour, '], openAttendance:['Open attendance','Voir les présences'],
  present:['Present','Présents'], kPresent:['Present now','Présents'], kLate:['Late arrivals','Retards'], kAbsent:['Absent','Absents'], kFlag:['Flagged check-ins','Pointages signalés'], kLeave:['On leave','En congé'],
  sLate:['avg. 14 min','moy. 14 min'], sAbsent:['no notice','sans justificatif'], sFlag:['to review','à examiner'], sLeave:['approved','approuvés'],
  chartTitle:['Check-ins this morning','Pointages ce matin'], chartSub:['Per 30-minute interval · now 10:42','Par tranche de 30 min · il est 10:42'], onTime:['On time','À l’heure'], lateL:['Late','Retard'], absentL:['Absent','Absents'], flaggedL:['Flagged','Signalés'],
  pendingTitle:['Pending leave','Congés en attente'], viewAll:['View all','Tout voir'],
  attnTitle:['Needs attention','À traiter'], review:['Review','Examiner'],
  mapTitle:['Live site map','Carte des sites en direct'], legendIn:['Checked in','Pointé'], legendFlag:['Outside geofence','Hors périmètre'], fence:['Geofence','Périmètre'], address:['Address','Adresse'],
  sitesTitle:['Sites today','Sites aujourd’hui'], colSite:['Site','Site'], colBranch:['Branch','Agence'], colPresence:['Presence','Présence'],
  attSub:['Today’s check-ins and check-outs within your scope','Pointages du jour dans votre périmètre'], export:['Export','Exporter'], checkInBehalf:['Check in on behalf','Pointer pour un employé'],
  allSites:['All sites','Tous les sites'], all:['All','Tous'], searchPh:['Search by name','Rechercher par nom'],
  colEmployee:['Employee','Employé'], colSchedule:['Schedule','Horaire'], colIn:['Check-in','Arrivée'], colOut:['Check-out','Départ'], colWorked:['Worked','Travaillé'], colStatus:['Status','Statut'], colMethod:['Method','Méthode'],
  viaApp:['Mobile app','Appli mobile'], viaBehalf:['By manager','Par un responsable'], intervention:['One-off intervention','Intervention ponctuelle'], recurring:['Recurring · Mon–Fri','Récurrent · lun–ven'], recurringN:['Recurring · nights','Récurrent · nuit'],
  emptyTitle:['No records match these filters','Aucun pointage ne correspond'], emptyDesc:['Try another status or site, or clear the filters.','Essayez un autre statut ou site, ou réinitialisez les filtres.'], clear:['Clear filters','Réinitialiser'],
  details:['Details','Détails'], timeline:['Activity','Historique'], method:['Method','Méthode'], distance:['Distance to geofence','Distance au périmètre'], device:['Device','Appareil'], inside:['Inside','Dans le périmètre'],
  dismiss:['Dismiss flag','Lever le signalement'], confirm:['Confirm fraud','Confirmer la fraude'], edit:['Edit record','Modifier'], close:['Close','Fermer'],
  noPermFlag:['Your role can view flags but not resolve them.','Votre rôle permet de voir les signalements, pas de les traiter.'],
  leaveSub:['Requests submitted by employees from the mobile app','Demandes envoyées par les employés depuis l’application'], pending:['Pending','En attente'], approved:['Approved','Approuvés'], rejected:['Rejected','Refusés'],
  approve:['Approve','Approuver'], reject:['Reject','Refuser'], colType:['Type','Type'], colDates:['Dates','Dates'],
  readOnly:['Read-only — approving leave requires the “Approve leave” permission.','Lecture seule — l’approbation nécessite la permission « Approuver les congés ».'],
  rejectTitle:['Reject leave request','Refuser la demande de congé'], rejectDesc:['The employee is notified in the app with your reason.','L’employé est notifié dans l’application avec votre motif.'], reasonPh:['Reason (required)','Motif (obligatoire)'], cancel:['Cancel','Annuler'], confirmReject:['Reject request','Refuser la demande'],
  emptyLeave:['Nothing pending','Rien en attente'], emptyLeaveDesc:['Every request in your scope has been handled.','Toutes les demandes de votre périmètre sont traitées.'],
  notBuiltDesc:['This screen isn’t part of the prototype yet. Dashboard, Attendance and Leave are fully interactive.','Cet écran n’est pas encore dans le prototype. Tableau de bord, Présences et Congés sont interactifs.'], backDash:['Back to dashboard','Retour au tableau de bord']
};
const TS = {
  overview:['Overview','Vue d’ensemble'],live:['Live board','Tableau en direct'],alerts:['Alerts','Alertes'],branchesSites:['Branches & Sites','Agences et sites'],schedules:['Schedules','Plannings'],users:['Users & Roles','Utilisateurs et rôles'],audit:['Audit log','Journal d’audit'],
  gMonitor:['Monitor','Suivi'],gManage:['Manage','Gestion'],gAdmin:['Admin','Administration'],
  collapse:['Collapse sidebar','Réduire le menu'],expand:['Expand sidebar','Déployer le menu'],menu:['Open menu','Ouvrir le menu'],close:['Close','Fermer'],upgrade:['Upgrade','Mettre à niveau'],
  planName:['Business plan','Offre Business'],employeesU:['employees','employés'],
  allScope:['All branches & sites','Toutes les agences et sites'],scopeSearch:['Search branches and sites','Rechercher une agence ou un site'],
  scopeNoteAll:['You can access the whole company.','Vous avez accès à toute l’entreprise.'],scopeNoteLimited:['Only scopes you have access to are listed.','Seuls les périmètres auxquels vous avez accès sont listés.'],
  search:['Search employees, sites, branches…','Rechercher employés, sites, agences…'],searchShort:['Search','Rechercher'],gEmp:['Employees','Employés'],gSites:['Sites','Sites'],gBranches:['Branches','Agences'],
  suggested:['Suggested','Suggestions'],searchEmptyDesc:['Try a name, job title, site or city.','Essayez un nom, un poste, un site ou une ville.'],
  notifs:['Notifications','Notifications'],markAll:['Mark all as read','Tout marquer comme lu'],all:['All','Toutes'],unread:['Unread','Non lues'],viewAllNotifs:['View all notifications','Voir toutes les notifications'],
  caughtUp:['You’re all caught up','Vous êtes à jour'],caughtUpDesc:['New alerts in your scope will appear here.','Les nouvelles alertes de votre périmètre apparaîtront ici.'],
  kFraud:['Fraud flag','Fraude'],kLeave:['Leave','Congé'],kMissing:['Missing check-out','Sortie manquante'],kUncov:['Uncovered','Non couvert'],
  nFraud:['Flagged check-in','Pointage signalé'],nLeave:['Leave request','Demande de congé'],nMissing:['Missing check-out','Sortie manquante'],nUncov:['Uncovered intervention','Intervention non couverte'],
  markRead:['Mark as read','Marquer comme lu'],markUnread:['Mark as unread','Marquer comme non lu'],
  help:['Help','Aide'],helpCenter:['Help center','Centre d’aide'],shortcuts:['Keyboard shortcuts','Raccourcis clavier'],whatsNew:['What’s new','Nouveautés'],contact:['Contact support','Contacter le support'],mobileApp:['Get the mobile app','Télécharger l’appli mobile'],newTag:['New','Nouveau'],status:['All systems operational','Tous les services fonctionnent'],
  account:['Account menu','Menu du compte'],profile:['My profile','Mon profil'],security:['Security','Sécurité'],twofa:['2FA on','2FA activée'],language:['Language','Langue'],theme:['Theme','Thème'],light:['Light','Clair'],dark:['Dark','Sombre'],system:['System','Système'],switchWs:['Switch workspace','Changer d’espace'],signOut:['Sign out','Se déconnecter'],
  today:['Today','Aujourd’hui'],dateShort:['Thu 15 Oct','jeu. 15 oct.'],
  noAccess:['You don’t have access to this page','Vous n’avez pas accès à cette page'],noAccessDesc:['Your role doesn’t include this permission. Ask a company admin if you need it.','Votre rôle n’inclut pas cette permission. Demandez-la à un administrateur.']
};
const TD={
  title:['Overview','Vue d’ensemble'],vsY:['vs yesterday','vs hier'],
  kExpected:['Expected today','Attendus aujourd’hui'],kExpectedPast:['Expected','Attendus'],kPresent:['Present now','Présents'],kPresentPast:['Attended','Présents'],kLate:['Late','En retard'],kAbsent:['Absent','Absents'],kLeave:['On leave','En congé'],kFlag:['Flagged','Signalés'],kPending:['Pending leave','Congés en attente'],
  live:['Live','En direct'],paused:['Paused','En pause'],final:['Final','Clôturé'],dayClosed:['day closed','journée clôturée'],refreshing:['refreshing…','actualisation…'],
  today:['Today','Aujourd’hui'],yesterday:['Yesterday','Hier'],lastMon:['Last Monday','Lundi dernier'],
  mapTitle:['Live map','Carte en direct'],good:['On track','Normal'],watch:['Watch','À surveiller'],risk:['At risk','Critique'],manager:['Manager','Responsable'],presentL:['Present','Présents'],openSite:['Open site','Ouvrir le site'],viewAttendance:['Attendance','Présences'],
  attnTitle:['Needs attention','À traiter'],attnEmpty:['Nothing needs attention','Rien à traiter'],attnEmptyDesc:['New issues in your scope will appear here.','Les nouveaux points de votre périmètre apparaîtront ici.'],
  tAll:['All','Tout'],tFraud:['Fraud','Fraude'],tMissing:['Check-outs','Sorties'],tUnsched:['Unscheduled','Hors planning'],tLeave:['Leave','Congés'],tUncov:['Interventions','Interventions'],
  review:['Review','Examiner'],dismiss:['Dismiss','Lever'],view:['View','Voir'],setOut:['Set check-out 06:00','Clôturer à 06:00'],remind:['Send reminder','Relancer'],addSched:['Add to schedule','Ajouter au planning'],reject:['Reject','Refuser'],approve:['Approve','Approuver'],assign:['Assign','Affecter'],notify:['Notify team','Prévenir l’équipe'],
  trendTitle:['Attendance rate','Taux de présence'],target:['Target 90%','Objectif 90 %'],
  methodTitle:['Check-in method','Méthode de pointage'],checkins:['check-ins','pointages'],mSelf:['Self check-in','Auto-pointage'],mSelfSub:['Mobile app inside geofence','Appli mobile dans le périmètre'],mProxy:['Proxy','Pour un tiers'],mProxySub:['By a site manager','Par un responsable de site'],mQr:['QR code','QR code'],mQrSub:['Scanned at site kiosk','Scanné à la borne du site'],
  punctTitle:['Punctuality','Ponctualité'],byBranch:['By branch','Par agence'],bySite:['By site','Par site'],onTimeL:['On time','À l’heure'],lateL:['Late','En retard'],
  pause:['Pause','Pause'],resume:['Resume','Reprendre'],checkedIn:['checked in','a pointé son arrivée'],checkedOut:['checked out','a pointé son départ'],
  newSub:['Your workspace is ready. Finish setup to start tracking attendance.','Votre espace est prêt. Terminez la configuration pour suivre les présences.'],
  setupTitle:['Get your team checking in','Lancez les premiers pointages'],setupSub:['Most companies finish in under 15 minutes.','La plupart des entreprises terminent en moins de 15 minutes.'],
  previewTitle:['Your dashboard will appear here','Votre tableau de bord apparaîtra ici'],previewSub:['Live attendance, alerts and trends fill in as soon as the first employees check in.','Présences, alertes et tendances s’affichent dès les premiers pointages.'],
  helpTitle:['Want a hand?','Besoin d’aide ?'],helpSub:['A specialist can set it up with you.','Un spécialiste peut le configurer avec vous.'],book:['Book a call','Prendre RDV']
};
const MANAGERS={pd:'Nadia Koné',cf:'Julien Robert',sd:'Amina Traoré',rl:'Olivier Dubois',pv:'Karine Faure'};
const PINPOS={pd:[68,52],cf:[50,70],sd:[38,34],rl:[60,24],pv:[70,90]};
const SPLIT={pd:[.70,.14,.16],cf:[.82,.06,.12],sd:[.74,.08,.18],rl:[.80,.05,.15],pv:[.72,.16,.12]};
const QRIDS=[5,11];
const UNSCHED=[{id:1,name:'Paul Mercier',site:'rl',time:'09:12'},{id:2,name:'Bastien Leroy',site:'pd',time:'07:40'},{id:3,name:'Zoé Fabre',site:'pv',time:'08:05'}];
const POOL=[['Élodie Marchand','cf','in','qr','ontime'],['Nathan Petit','sd','in','self','late'],['Julie Lambert','pd','out','self','overtime'],['Omar Benali','rl','in','self','ontime'],['Théo Garnier','pv','in','proxy','late'],['Sarah Lemoine','sd','out','self','early'],['Lina Chevalier','rl','in','qr','ontime'],['Maxime Roche','cf','in','self','late'],['Antoine Girard','pd','in','self','ontime']];
const BRANCHES=[{id:'lyon',name:'Lyon',sites:['pd','cf']},{id:'pn',name:'Paris Nord',sites:['sd','rl']},{id:'mrs',name:'Marseille',sites:['pv']}];
const DEFAULT_SCOPE={admin:{t:'company'},branch:{t:'branch',id:'pn'},site:{t:'site',id:'pd'}};
const EMAILS={admin:'claire@batiplus.fr',branch:'marc.olivier@batiplus.fr',site:'nadia.kone@batiplus.fr'};
const UNCOV=[{id:1,site:'cf',desc:['Night security, tonight 22:00–06:00 · no one assigned','Gardiennage de nuit, ce soir 22:00–06:00 · personne d’affecté'],time:['09:30','09:30']},{id:2,site:'sd',desc:['Inventory count, Sat 17 Oct 07:00–12:00 · 2 of 4 slots open','Inventaire, sam. 17 oct. 07:00–12:00 · 2 postes sur 4 libres'],time:['Yesterday','Hier']},{id:3,site:'pd',desc:['Lift inspection, Mon 19 Oct 08:00–10:00 · assignee on leave','Contrôle ascenseur, lun. 19 oct. 08:00–10:00 · intervenant en congé'],time:['Yesterday','Hier']}];
const ST = {
  ontime:['ok','On time','À l’heure'], late:['warn','Late','En retard'], early:['warn','Early leave','Départ anticipé'], absent:['bad','Absent','Absent'],
  missing:['orange','Missing check-out','Sortie manquante'], overtime:['violet','Overtime','Heures sup.'], leave:['info','On leave','En congé'],
  holiday:['neutral','Holiday','Férié'], flagged:['bad','Flagged','Signalé'], scheduled:['neutral','Scheduled','Prévu'],
  pending:['warn','Pending','En attente'], approved:['ok','Approved','Approuvé'], rejected:['bad','Rejected','Refusé'], fraud:['bad','Fraud confirmed','Fraude confirmée']
};
const SITES = [
  {id:'pd',name:'Part-Dieu Tower',branch:'Lyon',addr:'17 Bd Vivier-Merle, Lyon',expected:48,present:41,late:4,absent:3,flagged:0,leave:2,r:64,points:'',fl:['Circle · 150 m','Cercle · 150 m']},
  {id:'cf',name:'Confluence Depot',branch:'Lyon',addr:'52 Quai Rambaud, Lyon',expected:32,present:28,late:2,absent:1,flagged:1,leave:2,r:0,points:'140,52 268,44 300,128 232,178 118,152',fl:['Polygon · 1.8 ha','Polygone · 1,8 ha']},
  {id:'sd',name:'Saint-Denis Hub',branch:'Paris Nord',addr:'8 Rue du Landy, Saint-Denis',expected:56,present:47,late:6,absent:3,flagged:2,leave:4,r:0,points:'118,56 292,64 304,166 152,180 102,118',fl:['Polygon · 2.6 ha','Polygone · 2,6 ha']},
  {id:'rl',name:'Roissy Logistics',branch:'Paris Nord',addr:'Zone Cargo 4, Roissy',expected:38,present:33,late:3,absent:2,flagged:0,leave:3,r:76,points:'',fl:['Circle · 200 m','Cercle · 200 m']},
  {id:'pv',name:'Port Vieux Yard',branch:'Marseille',addr:'Quai de Rive Neuve, Marseille',expected:24,present:19,late:1,absent:2,flagged:1,leave:2,r:0,points:'150,40 262,58 284,158 172,182 112,120',fl:['Polygon · 1.2 ha','Polygone · 1,2 ha']}
];
const ROLES = {
  admin:{name:'Claire Vasseur',role:['Company admin','Administratrice'],scope:['Whole company','Toute l’entreprise'],sites:['pd','cf','sd','rl','pv'],perms:{approve:1,review:1,behalf:1,edit:1,reports:1,admin:1}},
  branch:{name:'Marc Olivier',role:['Branch manager','Responsable d’agence'],scope:['Paris Nord branch','Agence Paris Nord'],sites:['sd','rl'],perms:{approve:1,review:1,behalf:1,edit:1,reports:1,org:1,users:1}},
  site:{name:'Nadia Koné',role:['Site manager','Cheffe de site'],scope:['Part-Dieu Tower','Part-Dieu Tower'],sites:['pd'],perms:{behalf:1}}
};
const RECORDS = [
  {id:1,name:'Camille Durand',job:['Electrician','Électricienne'],site:'pd',sched:'08:00–17:00',st:'recurring',in:'07:54',out:'',worked:'2h 48m',status:'ontime',method:'app'},
  {id:2,name:'Yanis Benali',job:['Carpenter','Menuisier'],site:'pd',sched:'08:00–17:00',st:'recurring',in:'08:21',out:'',worked:'2h 21m',status:'late',method:'app',lateBy:21},
  {id:3,name:'Thomas Lefèvre',job:['Plumber','Plombier'],site:'pd',sched:'08:00–17:00',st:'recurring',in:'',out:'',worked:'',status:'absent',method:''},
  {id:4,name:'Manon Roux',job:['Cleaning agent','Agente d’entretien'],site:'pd',sched:'06:00–10:00',st:'recurring',in:'05:50',out:'10:38',worked:'4h 48m',status:'overtime',method:'app'},
  {id:5,name:'Léa Moreau',job:['Forklift operator','Cariste'],site:'cf',sched:'07:00–15:00',st:'recurring',in:'06:58',out:'',worked:'3h 44m',status:'ontime',method:'app'},
  {id:6,name:'Hugo Martin',job:['Night guard','Agent de nuit'],site:'cf',sched:'22:00–06:00',st:'recurringN',in:'21:55',out:'',worked:'—',status:'missing',method:'app'},
  {id:7,name:'Jules Fontaine',job:['Warehouse clerk','Magasinier'],site:'cf',sched:'11:00–19:00',st:'recurring',in:'',out:'',worked:'',status:'scheduled',method:''},
  {id:8,name:'Mehdi Haddad',job:['Logistics agent','Agent logistique'],site:'sd',sched:'08:00–17:00',st:'recurring',in:'08:03',out:'',worked:'2h 39m',status:'flagged',method:'app',flag:'dist',dist:'412 m'},
  {id:9,name:'Amina Diallo',job:['Order picker','Préparatrice'],site:'sd',sched:'08:00–17:00',st:'recurring',in:'07:49',out:'',worked:'2h 53m',status:'ontime',method:'behalf'},
  {id:10,name:'Karim Saïdi',job:['Order picker','Préparateur'],site:'sd',sched:'08:00–17:00',st:'recurring',in:'08:06',out:'',worked:'2h 36m',status:'flagged',method:'app',flag:'mock'},
  {id:11,name:'Sofia Rossi',job:['Dock supervisor','Cheffe de quai'],site:'rl',sched:'06:00–14:00',st:'recurring',in:'05:57',out:'',worked:'4h 45m',status:'ontime',method:'app'},
  {id:12,name:'Lucas Bernard',job:['Driver','Chauffeur'],site:'rl',sched:'06:00–14:00',st:'recurring',in:'06:12',out:'',worked:'4h 30m',status:'late',method:'app',lateBy:12},
  {id:13,name:'Inès Garcia',job:['Crane operator','Grutière'],site:'pv',sched:'08:00–17:00',st:'recurring',in:'',out:'',worked:'',status:'leave',method:''},
  {id:14,name:'Chloé Petit',job:['Safety inspector','Inspectrice sécurité'],site:'pv',sched:'07:00–11:00',st:'intervention',in:'06:55',out:'10:20',worked:'3h 25m',status:'early',method:'app'},
  {id:15,name:'Rémi Lambert',job:['Rigger','Élingueur'],site:'pv',sched:'08:00–17:00',st:'recurring',in:'',out:'',worked:'',status:'absent',method:''},
  {id:16,name:'Élodie Marchand',job:['Warehouse clerk','Magasinière'],site:'cf',sched:'11:00–19:00',st:'recurring',in:'',out:'',worked:'',status:'scheduled',method:''},
  {id:17,name:'Nathan Petit',job:['Order picker','Préparateur'],site:'sd',sched:'11:00–19:00',st:'recurring',in:'',out:'',worked:'',status:'scheduled',method:''},
  {id:18,name:'Omar Benali',job:['Driver','Chauffeur'],site:'rl',sched:'11:00–19:00',st:'recurring',in:'',out:'',worked:'',status:'scheduled',method:''},
  {id:19,name:'Théo Garnier',job:['Rigger','Élingueur'],site:'pv',sched:'10:30–18:30',st:'recurring',in:'',out:'',worked:'',status:'scheduled',method:''},
  {id:20,name:'Sarah Lemoine',job:['Cleaning agent','Agente d’entretien'],site:'sd',sched:'06:00–10:00',st:'recurring',in:'05:58',out:'10:02',worked:'4h 04m',status:'ontime',method:'app'},
  {id:21,name:'Bastien Leroy',job:['Site technician','Technicien'],site:'pd',sched:'07:00–10:30',st:'intervention',in:'06:55',out:'10:31',worked:'3h 36m',status:'ontime',method:'app'},
  {id:22,name:'Lina Chevalier',job:['Dock agent','Agente de quai'],site:'rl',sched:'09:00–17:00',st:'recurring',in:'08:57',out:'',worked:'1h 45m',status:'ontime',method:'app'}
];
const WORKDAYS=[1,2,5,6,7,8,9,12,13,14];
const HIST=(()=>{ const out=[], tm=x=>{const [h,m]=x.split(':').map(Number);return h*60+m;}, fm=m=>{m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}, dur=(a,b)=>{let d=tm(b)-tm(a);if(d<0)d+=1440;return Math.floor(d/60)+'h '+String(d%60).padStart(2,'0')+'m';};
  WORKDAYS.forEach(d=>RECORDS.forEach(b=>{ const r=(b.id*31+d*17+(b.id*d)%7)%100, [s0,e0]=b.sched.split('–'); let st,i='',o='';
    st=r<60?'ontime':r<72?'late':r<77?'early':r<82?'absent':r<86?'missing':r<92?'overtime':r<96?'leave':'flagged';
    if(st==='ontime'||st==='flagged'){i=fm(tm(s0)-(r%9)-1);o=fm(tm(e0)+(r%6));} if(st==='late'){i=fm(tm(s0)+6+(r%25));o=fm(tm(e0)+(r%4));} if(st==='early'){i=fm(tm(s0)-(r%5)-1);o=fm(tm(e0)-20-(r%40));} if(st==='overtime'){i=fm(tm(s0)-(r%7)-1);o=fm(tm(e0)+25+(r%40));} if(st==='missing'){i=fm(tm(s0)-(r%6)-1);}
    const method=b.id===9||(i&&r%11===0)?'behalf':i&&r%7===0?'qr':i?'app':'';
    const ed=st==='missing'&&r%2?{by:'Nadia Koné',at:d+' Oct 18:05'}:i&&r%17===0?{by:'Claire Vasseur',at:d+' Oct 17:40'}:st==='absent'&&r%3===0?{by:'Marc Olivier',at:d+' Oct 09:20'}:null;
    out.push(Object.assign({},b,{id:1000+d*100+b.id,emp:b.id,date:d,in:i,out:o,worked:i&&o?dur(i,o):'',status:st,method:ed&&ed.by==='Claire Vasseur'&&r%2?'admin':method,flag:st==='flagged'?(r%2?'dist':'mock'):undefined,dist:st==='flagged'?(160+r*3)+' m':undefined,lateBy:st==='late'?6+(r%25):undefined,offline:!!i&&r%13===0,edit:ed,cleared:false,fraud:false,proxyBy:undefined}));
  })); return out; })();
const tmx=x=>{if(!x)return null;const [h,m]=x.split(':').map(Number);return h*60+m;};
const fmtD=m=>{const a=Math.abs(m);return (a>=60?Math.floor(a/60)+'h '+String(a%60).padStart(2,'0'):a)+(a>=60?'':' min');};
const durS=(a,b)=>{let d=tmx(b)-tmx(a);if(d<=0)d+=1440;return Math.floor(d/60)+'h '+String(d%60).padStart(2,'0')+'m';};
const wrapD=(a,b)=>((a-b+720)%1440+1440)%1440-720;
const empIdOf=r=>'EMP-'+String(100+(r.emp||r.id)*7).padStart(4,'0');
const mgrOf=site=>({pd:'Nadia Koné',cf:'Julien Roche',sd:'Marc Olivier',rl:'Marc Olivier',pv:'Sarah Benoît'})[site]||'Marc Olivier';
const TDR={profile:['View profile','Voir le profil'],times:['Scheduled vs actual','Prévu vs réel'],editTimes:['Edit times','Modifier les heures'],scheduled:['Scheduled','Prévu'],actual:['Actual','Réel'],diff:['Difference','Écart'],
  worked:['Worked','Travaillé'],location:['Location & device','Localisation et appareil'],center:['Site center','Centre du site'],noGps:['No GPS data — entered manually','Pas de GPS — saisie manuelle'],
  selfies:['Selfies','Selfies'],history:['Edit history','Historique des modifications'],noHistory:['No edits — this record is as captured.','Aucune modification — pointage tel que capturé.'],
  notes:['Notes','Notes'],notePh:['Add a note for other managers…','Ajouter une note pour les responsables…'],post:['Post note','Publier'],
  delete:['Delete','Supprimer'],changeStatus:['Change status','Changer le statut'],approveRec:['Approve record','Approuver'],approveFlag:['Approve — valid check-in','Approuver — pointage valide'],rejectFlag:['Reject — confirm fraud','Rejeter — fraude'],
  saveChanges:['Save changes','Enregistrer'],reason:['Reason (required)','Motif (obligatoire)'],reasonPh:['e.g. Employee forgot to check out, confirmed by site manager','ex. Oubli de pointage, confirmé par le chef de site'],
  errTime:['Check-out must be after check-in.','Le départ doit être après l’arrivée.'],errReason:['Add a reason — it is saved in the edit history.','Indiquez un motif — il est conservé dans l’historique.'],
  delTitle:['Delete this record?','Supprimer ce pointage ?'],delPh:['e.g. Duplicate entry','ex. Doublon'],delConfirm:['Delete record','Supprimer'],
  change:['Change','Modifier'],searchPh:['Search by name or employee ID','Rechercher par nom ou matricule'],noEmp:['No employees match in your scope.','Aucun employé ne correspond dans votre périmètre.'],
  overlapTitle:['Overlaps an existing record','Chevauche un pointage existant'],openRec:['Open existing record','Ouvrir le pointage existant'],evidence:['Evidence','Justificatif'],optional:['optional','facultatif'],
  attach:['Attach files','Joindre des fichiers'],attachHint:['Timesheet photo, signed form, PDF · up to 10 MB each','Photo de feuille de temps, formulaire signé, PDF · 10 Mo max.']};
const TA={title:['Attendance records','Registre des présences'],export:['Export','Exporter'],add:['Add manual record','Ajouter un pointage'],views:['Views','Vues'],delView:['Delete view','Supprimer la vue'],
  vAll:['All records','Tous les pointages'],vFlag:['Flagged this week','Signalés cette semaine'],vMissing:['Missing check-outs','Sorties manquantes'],
  rToday:['Today','Aujourd’hui'],rYest:['Yesterday','Hier'],r7:['Last 7 days','7 derniers jours'],rMonth:['This month','Ce mois-ci'],rCustom:['Custom range','Période personnalisée'],from:['From','Du'],to:['To','Au'],
  allBranches:['All branches','Toutes les agences'],allSites:['All sites','Tous les sites'],empPh:['Employee name or ID','Nom ou matricule'],status:['Status','Statut'],allMethods:['All methods','Toutes méthodes'],
  mApp:['Mobile app','Appli mobile'],mProxy:['Proxy','Pour un tiers'],mQr:['QR code','QR code'],mAdmin:['Admin entry','Saisie admin'],flagOnly:['Flagged only','Signalés uniquement'],offline:['Synced offline','Synchronisés hors ligne'],
  clear:['Clear','Effacer'],done:['Done','OK'],clearAll:['Clear all filters','Effacer les filtres'],saveView:['Save view','Enregistrer la vue'],saveTitle:['Save as view','Enregistrer comme vue'],viewPh:['e.g. Paris Nord · late arrivals','ex. Paris Nord · retards'],cancel:['Cancel','Annuler'],save:['Save view','Enregistrer'],
  columns:['Columns','Colonnes'],showCols:['Show columns','Colonnes affichées'],
  cDate:['Date','Date'],cEmp:['Employee','Employé'],cSite:['Site','Site'],cSched:['Scheduled','Prévu'],cIn:['Check-in','Arrivée'],cOut:['Check-out','Départ'],cWorked:['Worked','Travaillé'],cStatus:['Status','Statut'],cMethod:['Method','Méthode'],cFlag:['Flag','Alerte'],cEdited:['Last edited by','Modifié par'],
  approve:['Approve','Approuver'],markAbsent:['Mark absent','Marquer absent'],exportSel:['Export selected','Exporter la sélection'],clearSel:['Clear selection','Désélectionner'],
  rowsPer:['Rows per page','Lignes par page'],noResTitle:['No records match your filters','Aucun pointage ne correspond'],
  emptyCoTitle:['No attendance records yet','Aucun pointage pour le moment'],emptyCoDesc:['Records appear here as soon as employees check in from the mobile app, or when you add one manually.','Les pointages apparaissent dès que les employés pointent depuis l’appli, ou quand vous en ajoutez un manuellement.'],createSched:['Create schedules','Créer des plannings'],
  addTitle:['Add manual record','Ajouter un pointage manuel'],addSub:['For a missed check-in, a paper timesheet or a correction.','Pour un oubli, une feuille de temps papier ou une correction.'],reason:['Reason','Motif'],reasonPh:['e.g. Paper timesheet signed by site manager','ex. Feuille de temps signée par le chef de site'],addSave:['Add record','Ajouter'],
  errEmp:['Select an employee.','Sélectionnez un employé.'],errTime:['Check-out must be after check-in.','Le départ doit être après l’arrivée.'],errReason:['Add a reason for the audit log.','Indiquez un motif pour le journal d’audit.'],
  running:['in progress','en cours'],approvedBy:['Approved by','Approuvé par']};
const LB_EV=[
  {id:19,site:'pv',patch:{in:'10:44',method:'app',status:'late',lateBy:14}},
  {id:16,site:'cf',patch:{in:'10:47',method:'qr',status:'ontime'}},
  {id:17,site:'sd',patch:{in:'10:51',method:'app',status:'flagged',flag:'dist',dist:'286 m'},flag:['Nathan Petit checked in 286 m outside Saint-Denis Hub','Nathan Petit a pointé à 286 m hors de Saint-Denis Hub']},
  {id:18,site:'rl',patch:{in:'10:55',method:'app',status:'ontime'}}
];
const FENCE={pd:['ok','Geofence active · circle 150 m','Géorepérage actif · cercle 150 m'],cf:['ok','Geofence active · polygon','Géorepérage actif · polygone'],sd:['bad','Geofence active · flags today','Géorepérage actif · alertes'],rl:['ok','Geofence active · circle 200 m','Géorepérage actif · cercle 200 m'],pv:['warn','Low GPS accuracy','Précision GPS faible']};
const PHONES={pd:'+33 6 12 44 80',cf:'+33 6 21 37 52',sd:'+33 7 81 22 19',rl:'+33 6 55 09 63',pv:'+33 6 40 18 27'};
const TL={title:['Live board','Tableau en direct'],checkIn:['Check in on behalf','Pointer l’arrivée'],checkOut:['Check out on behalf','Pointer le départ'],view:['View record','Voir le pointage'],
  cExpected:['Expected','Attendus'],cPresent:['Present','Présents'],cNot:['Not arrived','Pas arrivés'],cLeft:['Left','Partis'],cAbsent:['Absent','Absents'],cLeave:['On leave','En congé'],all:['All','Tous'],flagged:['Flagged','Signalés'],
  searchPh:['Search employee','Rechercher un employé'],allSites:['All sites in scope','Tous les sites du périmètre'],list:['List','Liste'],grid:['Grid','Grille'],presentShort:['present','présents'],
  colEmp:['Employee','Employé'],colSched:['Scheduled','Prévu'],colIn:['Check-in','Arrivée'],colOut:['Check-out','Départ'],colStatus:['Status','Statut'],colMethod:['Method','Méthode'],colDist:['Distance','Distance'],colActions:['Actions','Actions'],inShort:['In','Arrivée'],outShort:['Out','Départ'],
  newTag:['NEW','NOUVEAU'],noMatch:['No employees match in this site.','Aucun employé ne correspond sur ce site.'],emptyTitle:['No employees match','Aucun employé ne correspond'],emptyDesc:['Try another status or clear the search.','Essayez un autre statut ou effacez la recherche.'],clear:['Clear filters','Réinitialiser'],
  remind:['Send reminder','Relancer'],markAbsent:['Mark as absent','Marquer absent'],clearSel:['Clear selection','Désélectionner'],
  time:['Time','Heure'],reason:['Reason','Motif'],reasonErr:['Select a reason to continue.','Sélectionnez un motif pour continuer.'],note:['Verification note','Note de vérification'],optional:['optional','facultatif'],notePh:['e.g. Seen at the site gate by the foreman','ex. Vu à l’entrée du site par le chef d’équipe'],
  verified:['I verified this employee is on site in person','J’ai vérifié en personne que l’employé est sur site'],cancel:['Cancel','Annuler'],
  pause:['Pause','Pause'],resume:['Resume','Reprendre'],
  mApp:['Mobile app','Appli mobile'],mProxy:['Proxy (site manager)','Pour un tiers (responsable)'],mQr:['QR code kiosk','Borne QR code'],mAdmin:['Admin correction','Correction administrateur'],
  left:['Left','Parti'],notArrived:['Not arrived','Pas arrivé'],dueAt:['Due','Prévu à'],minLate:['min late','min de retard']};
const REASONS=[['','Select a reason','Choisir un motif'],['nophone','No smartphone','Pas de smartphone'],['battery','Phone battery dead','Batterie déchargée'],['app','App or GPS issue','Problème d’appli ou de GPS'],['forgot','Forgot to check in/out','Oubli de pointage'],['other','Other','Autre']];
const LEAVES = [
  {id:1,name:'Julie Lambert',site:'pd',type:['Paid leave','Congés payés'],dates:['26–30 Oct','26–30 oct.'],days:5,sub:['2 days ago','il y a 2 j'],status:'pending'},
  {id:2,name:'Mehdi Haddad',site:'sd',type:['RTT day','Jour RTT'],dates:['Fri 23 Oct','ven. 23 oct.'],days:1,sub:['Yesterday','Hier'],status:'pending'},
  {id:3,name:'Sofia Rossi',site:'rl',type:['Paid leave','Congés payés'],dates:['2–13 Nov','2–13 nov.'],days:10,sub:['3 days ago','il y a 3 j'],status:'pending',note:['3 others at Roissy off that week','3 autres absents à Roissy cette semaine'],noteKind:'warn'},
  {id:4,name:'Léa Moreau',site:'cf',type:['Sick leave','Arrêt maladie'],dates:['13–14 Oct','13–14 oct.'],days:2,sub:['Today, 07:12','Aujourd’hui, 07:12'],status:'pending',note:['Medical certificate.pdf','Certificat médical.pdf'],noteKind:'clip'},
  {id:5,name:'Karim Saïdi',site:'sd',type:['Unpaid leave','Congé sans solde'],dates:['Tue 20 Oct','mar. 20 oct.'],days:1,sub:['4 days ago','il y a 4 j'],status:'pending'},
  {id:6,name:'Antoine Girard',site:'pd',type:['RTT day','Jour RTT'],dates:['Mon 19 Oct','lun. 19 oct.'],days:1,sub:['5 days ago','il y a 5 j'],status:'pending'},
  {id:7,name:'Inès Garcia',site:'pv',type:['Paid leave','Congés payés'],dates:['12–16 Oct','12–16 oct.'],days:5,sub:['1 Oct','1 oct.'],status:'approved'},
  {id:8,name:'Paul Mercier',site:'rl',type:['RTT day','Jour RTT'],dates:['Fri 9 Oct','ven. 9 oct.'],days:1,sub:['28 Sep','28 sept.'],status:'rejected'}
];
const ON=[3,9,16,11,14,30,58,34,8,4,2,1], LATE=[0,0,1,1,1,1,2,4,3,2,1,0];
const PINS=[[188,92,'ok'],[214,100,'ok'],[196,124,'ok'],[226,120,'warn'],[176,110,'ok'],[208,84,'ok'],[232,102,'ok'],[184,132,'warn'],[218,134,'ok'],[170,94,'ok'],[244,116,'ok'],[200,140,'ok']];
const OUT=[[352,34],[52,196]];

class AdminBase extends DCLogic {
  renderVals(){ return {ad:this.renderVals0()}; }
  state = {page:'dashboard',theme:null,lang:null,mapSite:null,status:'all',siteF:'all',q:'',drawer:null,records:RECORDS,leaves:LEAVES,leaveTab:'pending',rejectId:null,reason:'',toasts:[],loading:false,w:1440,collapsed:null,mobileNav:false,dbDate:15,dbOpen:null,pinOpen:null,attnTab:'all',dbDone:{},trendR:7,tHover:null,punctBy:'branch',dbTick:0,dbRefAt:0,dbSpin:false,dbPaused:false,dbLive:[],dbSeq:0,dbSetup:{company:1},lbSite:'all',lbStatus:'all',lbQ:'',lbView:'list',lbClosed:{},lbSel:{},lbFresh:{},lbTick:0,lbEv:0,lbPaused:false,lbM:null,drNotes:{},drEdit:null,drDel:null,drHist:{},deleted:{},drNote:'',arRange:'7d',arFrom:9,arTo:15,arBranch:'all',arSite:'all',arEmp:'',arStatus:[],arMethod:'all',arFlag:false,arOffline:false,arSort:['date','desc'],arHidden:{sched:false},arPage:1,arPer:25,arSel:{},arOpen:null,arViews:[{id:'v1',name:'Paris Nord · late',saved:true,f:{arRange:'month',arBranch:'pn',arStatus:['late']}}],arView:'all',arViewName:'',arOv:{},arManual:[],arAdd:null,open:null,scope:null,scopeQ:'',treeClosed:{},searchQ:'',readN:{l3:1},notifTab:'all',themePref:null,sysDark:false};
  searchRef=React.createRef();
  componentDidMount(){ this._mounted=1; this.onR=()=>this.setState({w:window.innerWidth}); this.onR(); window.addEventListener('resize',this.onR); if(this.props.initialPage) this.go(this.props.initialPage);
    this.mq=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)'); if(this.mq){ this.onMq=()=>this.setState({sysDark:this.mq.matches}); this.onMq(); this.mq.addEventListener&&this.mq.addEventListener('change',this.onMq); }
    this.onKey=e=>{ if((e.metaKey||e.ctrlKey)&&(e.key||'').toLowerCase()==='k'){ e.preventDefault(); this.setState({open:'search'},()=>{const el=this.searchRef.current; el&&el.focus();}); } else if(e.key==='Escape'&&(this.state.open||this.state.mobileNav)) this.setState({open:null,mobileNav:false}); };
    window.addEventListener('keydown',this.onKey);
    this.liveT=setInterval(()=>this.liveTick(),1000); }
  lbTick(){ const s=this.state, n=s.lbTick+1, patch={lbTick:n};
    if(!s.lbPaused&&n%7===0){ const ev=LB_EV[s.lbEv]; if(ev){ patch.lbEv=s.lbEv+1; const r=s.records.find(x=>x.id===ev.id); if(r&&!r.in&&(this._eff||[]).includes(ev.site)){ this.updRec(ev.id,ev.patch); patch.lbFresh=Object.assign({},s.lbFresh,{[ev.id]:n}); if(ev.flag) this.toast((this._L?'Nouveau signalement : ':'New flag: ')+ev.flag[this._L],'bad'); } } }
    this.setState(patch); }
  liveTick(){ const s=this.state; if(s.page==='live'){ this.lbTick(); return; } if(s.page!=='dashboard'||this.props.dashState==='new') return; const n=s.dbTick+1, patch={dbTick:n};
    if(!s.dbPaused&&s.dbDate===15&&n%6===0){ const pool=POOL.filter(p=>(this._eff||[]).includes(p[1])); if(pool.length){ const k=s.dbSeq,p=pool[k%pool.length],m=10*60+42+k+1; patch.dbLive=[{id:'lv'+k,name:p[0],site:p[1],act:p[2],method:p[3],status:p[4],time:String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'),born:n}].concat(s.dbLive).slice(0,20); patch.dbSeq=k+1; } }
    this.setState(patch); }
  componentWillUnmount(){ window.removeEventListener('resize',this.onR); window.removeEventListener('keydown',this.onKey); clearInterval(this.liveT); clearTimeout(this.spinT); if(this.mq&&this.mq.removeEventListener) this.mq.removeEventListener('change',this.onMq); clearTimeout(this.lt); }
  componentDidUpdate(pp){
    if(pp.theme!==this.props.theme) this.setState({theme:null});
    if(pp.lang!==this.props.lang) this.setState({lang:null});
    if((pp.pageNonce!==this.props.pageNonce||pp.initialPage!==this.props.initialPage)&&this.props.initialPage) this.go(this.props.initialPage);
    if(pp.role!==this.props.role) this.setState({mapSite:null,siteF:'all',drawer:null,status:'all',scope:null,open:null});
    if(pp.sidebar!==this.props.sidebar) this.setState({collapsed:null});
  }
  toast(msg,kind){ const id=Math.random(); this.setState(s=>({toasts:[...s.toasts,{id,msg,kind:kind||'ok'}]})); setTimeout(()=>this.setState(s=>({toasts:s.toasts.filter(x=>x.id!==id)})),3600); }
  go(page,extra){ if(page==='attendance'&&extra&&(extra.status||extra.siteF)) extra=Object.assign({},extra,{arStatus:extra.status&&extra.status!=='all'?[extra.status]:[],arRange:'today',arFrom:15,arTo:15,arSite:extra.siteF||'all',arBranch:'all',arPage:1,arFlag:false,arOffline:false,arMethod:'all',arEmp:'',arView:null}); if(this.props.onPageChange) this.props.onPageChange(page); this.setState(Object.assign({page,drawer:null,open:null,mobileNav:false},extra||{})); if(page==='attendance'){ this.setState({loading:true}); clearTimeout(this.lt); this.lt=setTimeout(()=>this.setState({loading:false}),500); } }
  updRec(id,patch){ if(id>=1000){ this.setState(s=>({arOv:Object.assign({},s.arOv,{[id]:Object.assign({},s.arOv[id]||{},patch)}),arManual:s.arManual.map(m=>m.id===id?Object.assign({},m,patch):m)})); return; } this.setState(s=>({records:s.records.map(r=>r.id===id?Object.assign({},r,patch):r)})); }
  updLeave(id,status){ this.setState(s=>({leaves:s.leaves.map(l=>l.id===id?Object.assign({},l,{status}):l)})); }

  renderVals0(){
    const s=this.state, L=(s.lang||this.props.lang||'en')==='fr'?1:0, theme=s.themePref==='system'?(s.sysDark?'dark':'light'):(s.theme||this.props.theme||'light'), dark=theme==='dark';
    const st={}; for(const k in TS) st[k]=TS[k][L];
    const t={}; for(const k in T) t[k]=T[k][L];
    const roleKey=ROLES[this.props.role]?this.props.role:'admin', role0=ROLES[roleKey], P=role0.perms;
    const scope=s.scope||DEFAULT_SCOPE[roleKey];
    const effSites=scope.t==='company'?role0.sites:scope.t==='branch'?BRANCHES.find(b=>b.id===scope.id).sites.filter(x=>role0.sites.includes(x)):[scope.id];
    const role=Object.assign({},role0,{sites:effSites}); this._eff=effSites; this._L=L;
    const sites=SITES.filter(x=>role.sites.includes(x.id)), siteById=Object.fromEntries(SITES.map(x=>[x.id,x]));
    const av=n=>{let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))%360;const ini=n.split(' ').map(p=>p[0]).slice(0,2).join('');return dark?{ini,bg:`oklch(0.34 0.07 ${h})`,fg:`oklch(0.9 0.06 ${h})`}:{ini,bg:`oklch(0.93 0.045 ${h})`,fg:`oklch(0.42 0.1 ${h})`};};
    const chip=k=>{const m=ST[k];return {label:m[1+L],bg:`var(--${m[0]}-bg)`,fg:`var(--${m[0]})`,dot:`var(--${m[0]}-dot)`};};
    const recs=s.records.filter(r=>role.sites.includes(r.site));
    const hist=HIST.concat(s.arManual).filter(r=>role.sites.includes(r.site)).map(r=>s.arOv[r.id]?Object.assign({},r,s.arOv[r.id]):r); this._hist=hist;
    const pendingAll=s.leaves.filter(l=>role.sites.includes(l.site)&&l.status==='pending');
    const nav=(id,icon,label,extra)=>Object.assign({label,icon,go:()=>this.go(id),bg:s.page===id?'var(--accent-soft)':'transparent',fg:s.page===id?'var(--accent)':'var(--text-2)',weight:s.page===id?600:500,justify:this.state.w<1100?'center':'flex-start',hasBadge:false},extra||{});
    const compact=s.w<1100;
    const navGroups=[
      {label:t.gWork,items:[nav('dashboard',I.dash,t.dashboard),nav('attendance',I.att,t.attendance),nav('planner',I.plan,t.planner),nav('leave',I.leave,t.leaveNav,{hasBadge:pendingAll.length>0&&!compact,badge:pendingAll.length})]},
      {label:t.gOrg,items:[nav('sites',I.sites,t.sites),nav('employees',I.emp,t.employees)].concat(P.reports?[nav('reports',I.rep,t.reports)]:[])},
    ].concat(P.admin?[{label:t.gAdmin,items:[nav('access',I.access,t.access),nav('settings',I.set,t.settings)]}]:[]);

    const sum=k=>sites.reduce((a,x)=>a+x[k],0), exp=sum('expected');
    const pctOf=(a,b)=>Math.round(a/b*100)+'%';
    const kpis=[
      {label:t.kPresent,value:sum('present'),sub:(L?'sur ':'of ')+exp,dot:'var(--ok-dot)',pct:pctOf(sum('present'),exp),go:()=>this.go('attendance',{status:'all'})},
      {label:t.kLate,value:sum('late'),sub:t.sLate,dot:'var(--warn-dot)',pct:pctOf(sum('late'),exp),go:()=>this.go('attendance',{status:'late'})},
      {label:t.kAbsent,value:sum('absent'),sub:t.sAbsent,dot:'var(--bad-dot)',pct:pctOf(sum('absent'),exp),go:()=>this.go('attendance',{status:'absent'})},
      {label:t.kFlag,value:sum('flagged'),sub:t.sFlag,dot:'var(--bad-dot)',pct:pctOf(sum('flagged'),exp),go:()=>this.go('attendance',{status:'flagged'})},
      {label:t.kLeave,value:sum('leave'),sub:t.sLeave,dot:'var(--info-dot)',pct:pctOf(sum('leave'),exp),go:()=>this.go('attendance',{status:'leave'})}
    ];
    const f=exp/198, on=ON.map(v=>Math.round(v*f)), late=LATE.map(v=>Math.round(v*f+ (f<1&&v>2?0.4:0)));
    const mx=Math.max(...on.map((v,i)=>v+late[i]))||1, top=Math.ceil(mx/3)*3||3;
    const chart=on.map((v,i)=>{const hh=5+Math.floor(i/2),mm=i%2?'30':'00';return {onH:(v/top*100)+'%',lateH:(late[i]/top*100)+'%',onC:'var(--accent)',onR:late[i]?'0 0 2px 2px':'4px 4px 2px 2px',border:'0',label:i%2?'':String(hh).padStart(2,'0')+':00',tip:`${String(hh).padStart(2,'0')}:${mm} — ${v} ${t.onTime.toLowerCase()}, ${late[i]} ${t.lateL.toLowerCase()}`};});
    chart.push({onH:'100%',lateH:'0%',onC:'transparent',onR:'4px',border:'1px dashed var(--border-strong)',label:'',tip:L?'À venir':'Upcoming'});
    const chartTicks=[top,Math.round(top*2/3),Math.round(top/3),0];

    const ms=siteById[s.mapSite&&role.sites.includes(s.mapSite)?s.mapSite:sites[0].id];
    const mapTabs=sites.map(x=>({name:x.name,go:()=>this.setState({mapSite:x.id}),bg:x.id===ms.id?'var(--surface)':'transparent',fg:x.id===ms.id?'var(--text)':'var(--text-2)',sh:x.id===ms.id?'0 1px 2px rgba(0,0,0,.08)':'none'}));
    const nPins=Math.min(PINS.length,Math.round(ms.present/4));
    const mapPins=PINS.slice(0,nPins).map(p=>({left:p[0]/4+'%',top:p[1]/2.2+'%',c:p[2]==='ok'?'var(--ok-dot)':'var(--warn-dot)',tip:''})).concat(OUT.slice(0,ms.flagged).map(p=>({left:p[0]/4+'%',top:p[1]/2.2+'%',c:'var(--bad-dot)',tip:t.legendFlag})));

    const siteRows=sites.map(x=>({name:x.name,branch:x.branch,present:x.present,expected:x.expected,pct:pctOf(x.present,x.expected),late:x.late,absent:x.absent,flagged:x.flagged,lateC:x.late?'var(--text)':'var(--text-3)',absentC:x.absent?'var(--text)':'var(--text-3)',flagC:x.flagged?'var(--bad)':'var(--text-3)',flagW:x.flagged?600:400}));

    const flagReason=r=>r.flag==='dist'?(L?`Pointage à ${r.dist} hors du périmètre`:`Checked in ${r.dist} outside geofence`):(L?'Localisation simulée détectée':'Mock location detected on device');
    const attention=recs.filter(r=>['flagged','missing','absent'].includes(r.status)).map(r=>({name:r.name,site:siteById[r.site].name,chip:chip(r.status),icon:r.status==='flagged'?I.shield:r.status==='missing'?I.logout:I.userx,
      reason:r.status==='flagged'?flagReason(r):r.status==='missing'?(L?'Pas de sortie depuis 06:00':'No check-out since shift ended 06:00'):(L?'Pas de pointage, prévu à 08:00':'No check-in, due 08:00'),
      open:()=>this.go('attendance',{drawer:r.id,status:'all'})}));

    const leaveRow=l=>{const n=l.note?{hasNote:true,note:l.note[L],noteC:l.noteKind==='warn'?'var(--warn)':'var(--text-2)',noteIcon:l.noteKind==='warn'?I.warn:I.clip}:{hasNote:false};
      return Object.assign({name:l.name,av:av(l.name),siteName:siteById[l.site].name,type:l.type[L],dates:l.dates[L],daysL:l.days+(L?(l.days>1?' jours':' jour'):(l.days>1?' days':' day')),submitted:l.sub[L],chip:chip(l.status),
        showActions:l.status==='pending'&&!!P.approve,showChip:l.status!=='pending'||!P.approve,
        approve:()=>{this.updLeave(l.id,'approved');this.toast(L?`Congé de ${l.name} approuvé`:`${l.name}’s leave approved`);},
        reject:()=>this.setState({rejectId:l.id,reason:''})},n);};
    const scopedLeaves=s.leaves.filter(l=>role.sites.includes(l.site));
    const leaveRows=scopedLeaves.filter(l=>s.leaveTab==='all'||l.status===s.leaveTab).map(leaveRow);
    const leaveTabs=[['pending',t.pending],['approved',t.approved],['rejected',t.rejected],['all',t.all]].map(([k,label])=>({label,count:k==='all'?scopedLeaves.length:scopedLeaves.filter(l=>l.status===k).length,bd:s.leaveTab===k?'var(--accent)':'transparent',fg:s.leaveTab===k?'var(--text)':'var(--text-3)',go:()=>this.setState({leaveTab:k})}));

    const inSite=s.siteF==='all'?recs:recs.filter(r=>r.site===s.siteF);
    const q=s.q.trim().toLowerCase();
    const searched=q?inSite.filter(r=>r.name.toLowerCase().includes(q)):inSite;
    const filtered=s.status==='all'?searched:searched.filter(r=>r.status===s.status);
    const order=['all','ontime','late','absent','flagged','missing','early','overtime','leave','scheduled'];
    const statusChips=order.map(k=>{const c=k==='all'?searched.length:searched.filter(r=>r.status===k).length;const on=s.status===k;const m=k==='all'?null:chip(k);
      return {k,count:c,label:k==='all'?t.all:m.label,hasDot:k!=='all',dot:m?m.dot:'',bg:on?'var(--accent-soft)':'var(--surface)',fg:on?'var(--accent)':'var(--text-2)',bd:on?'var(--accent)':'var(--border)',go:()=>this.setState({status:k})};}).filter(c=>c.k==='all'||c.count>0||c.k===s.status);
    const rowOf=r=>({id:r.id,name:r.name,job:r.job[L],av:av(r.name),siteName:siteById[r.site].name,sched:r.sched,shiftType:t[r.st],inT:r.in||'—',outT:r.out||'—',worked:r.worked||'—',
      inC:r.status==='late'?'var(--warn)':r.status==='flagged'?'var(--bad)':r.in?'var(--text)':'var(--text-3)',outC:r.status==='early'?'var(--warn)':r.status==='overtime'?'var(--violet)':r.out?'var(--text)':'var(--text-3)',
      chip:chip(r.fraud?'fraud':r.status),methodL:r.method==='app'?t.viaApp:r.method==='behalf'?t.viaBehalf:'—',rowBg:s.drawer===r.id?'var(--accent-soft)':'transparent',open:()=>this.setState({drawer:r.id})});
    const rows=filtered.map(rowOf);

    let d=null; const dr=s.drawer&&!s.deleted[s.drawer]&&(recs.find(r=>r.id===s.drawer)||hist.find(r=>r.id===s.drawer));
    if(dr){ const site=siteById[dr.site], me=role0.name, nowAt='15 Oct 10:42', Ld={}; for(const k in TDR) Ld[k]=TDR[k][L];
      const day=dr.date||15, outside=dr.flag==='dist'&&!dr.cleared, mock=dr.flag==='mock'&&!dr.cleared;
      const m=dr.method==='behalf'?'proxy':(dr.method==='qr'||(day===15&&QRIDS.includes(dr.id)&&dr.method==='app'))?'qr':dr.method||'';
      const [ss,se]=dr.sched.split('–'), planned=durS(ss,se);
      const dIn=dr.in?wrapD(tmx(dr.in),tmx(ss)):null, dOut=dr.out?wrapD(tmx(dr.out),tmx(se)):null;
      const pill=(txt,k)=>({diff:txt,diffBg:'var(--'+k+'-bg)',diffC:'var(--'+k+')'});
      const tIn=dIn===null?pill('—','neutral'):dIn>10?pill('+'+fmtD(dIn)+(L?' de retard':' late'),'warn'):dIn<0?pill(fmtD(dIn)+(L?' en avance':' early'),'ok'):pill(L?'À l’heure':'On time','ok');
      const tOut=dOut===null?(dr.in&&day===15&&dr.status!=='missing'?pill(L?'En cours':'In progress','info'):dr.status==='missing'?pill(L?'Sortie manquante':'Missing','orange'):pill('—','neutral')):dOut<-5?pill(fmtD(dOut)+(L?' plus tôt':' early'),'warn'):dOut>20?pill('+'+fmtD(dOut),'violet'):pill(L?'À l’heure':'On time','ok');
      const tW=dr.worked&&dr.worked!=='—'&&dr.out?pill(dr.worked,'neutral'):pill('—','neutral');
      const times=[{k:L?'Arrivée':'Check-in',sched:ss,act:dr.in||'—',actC:dIn>10?'var(--warn)':outside||mock?'var(--bad)':'var(--text)'},{k:L?'Départ':'Check-out',sched:se,act:dr.out||'—',actC:dOut!==null&&dOut<-5?'var(--warn)':dOut>20?'var(--violet)':'var(--text)'},{k:Ld.worked,sched:planned,act:dr.out?dr.worked:'—',actC:'var(--text)'}].map((x,i)=>Object.assign(x,[tIn,tOut,tW][i]));
      const proxyBy=dr.proxyBy||mgrOf(dr.site);
      const ML={app:L?'Autonome · appli mobile':'Self · mobile app',proxy:(L?'Pour un tiers par ':'Proxy by ')+proxyBy,qr:L?'QR code · borne du site':'QR code · site kiosk',admin:(L?'Saisie admin par ':'Admin entry by ')+((dr.edit&&dr.edit.by)||me)};
      const MS={app:L?'Autonome':'Self',proxy:(L?'Par ':'Proxy · ')+proxyBy.split(' ')[0],qr:'QR',admin:'Admin'};
      const MI={app:I.phone,proxy:'M16 11l2 2 4-4M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1',qr:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3z',admin:I.access};
      const j=(dr.emp||dr.id)*7+day;
      const ciX=outside?352:200+((j*13)%30)-12, ciY=outside?34:108+((j*7)%22)-14;
      const coX=200+((j*5)%26)-16, coY=108+((j*11)%24)-6;
      const ciDist=!dr.in||m==='admin'?'—':outside?dr.dist+(L?' · hors périmètre':' · outside'):(6+(j%30))+' m'+(L?' · dans le périmètre':' · inside');
      const coDist=!dr.out||m==='admin'?'—':(4+(j%22))+' m'+(L?' · dans le périmètre':' · inside');
      const acc=!dr.in?'—':m==='admin'?'n/a':mock?(L?'±1 m · trop précis, suspect':'±1 m · suspiciously precise'):m==='proxy'?'±12 m':m==='qr'?(L?'Borne fixe':'Fixed kiosk'):'±'+(5+j%9)+' m';
      const dev=!dr.in?'—':m==='proxy'?(L?'Tablette du site · Galaxy Tab A8':'Site tablet · Galaxy Tab A8'):m==='qr'?(L?'Borne QR · entrée A':'QR kiosk · Entrance A'):m==='admin'?(L?'Console web':'Web console'):['iPhone 13 · iOS 18.1','Pixel 7 · Android 15','Galaxy A54 · Android 14'][j%3];
      const facts=[{k:L?'Méthode':'Method',v:m?ML[m]:'—',c:'var(--text)'},{k:L?'Précision GPS':'GPS accuracy',v:acc,c:mock?'var(--bad)':'var(--text)'},{k:L?'Distance à l’arrivée':'Distance at check-in',v:ciDist,c:outside?'var(--bad)':'var(--text)'},{k:L?'Distance au départ':'Distance at check-out',v:coDist,c:'var(--text)'},{k:L?'Appareil':'Device',v:dev,c:'var(--text)'},{k:L?'Version appli':'App version',v:m==='app'||m==='proxy'?(mock?'v4.1.0 · '+(L?'obsolète':'outdated'):'v4.2.1'):'—',c:mock?'var(--warn)':'var(--text)'}];
      const offAt=dr.in?(tmx(dr.in)+134):0, offL=(L?'Hors ligne · synchronisé à ':'Offline · synced ')+(dr.in?String(Math.floor(offAt/60)%24).padStart(2,'0')+':'+String(offAt%60).padStart(2,'0'):'');
      const seed=dr.edit?[{by:dr.edit.by,at:dr.edit.at,changes:dr.status==='absent'?[{k:L?'Statut':'Status',a:L?'Prévu':'Scheduled',b:chip('absent').label}]:dr.method==='admin'&&dr.id>=5000?[{k:L?'Pointage':'Record',a:'—',b:L?'Créé manuellement':'Created manually'}]:[{k:L?'Départ':'Check-out',a:'—',b:dr.out||se}],reason:dr.manualReason||(dr.status==='absent'?(L?'Aucun appel ni justificatif reçu':'No call or notice received'):(L?'Oubli de pointage, confirmé par le chef de site':'Forgot to check out — confirmed by site manager'))}]:[];
      const histList=seed.concat(s.drHist[dr.id]||[]).reverse().map(h=>Object.assign({},h,{av:av(h.by)}));
      const seedNotes=dr.flag?[{by:mgrOf(dr.site),at:'15 Oct 09:05',text:dr.flag==='dist'?(L?'J’ai appelé Mehdi : il dit s’être garé au dépôt en face. À vérifier avec la caméra du portail.':'Called Mehdi — says he parked at the depot across the road. Worth checking the gate camera.'):(L?'Deuxième alerte de localisation simulée ce mois-ci pour cet appareil.':'Second mock-location alert this month from this device.')}]:dr.status==='missing'?[{by:mgrOf(dr.site),at:day+' Oct 06:20',text:L?'Relancé par SMS, pas de réponse.':'Sent an SMS reminder, no reply yet.'}]:[];
      const notes=seedNotes.concat(s.drNotes[dr.id]||[]).map(n=>Object.assign({},n,{av:av(n.by)}));
      const events=[{time:ss,label:L?'Début prévu':'Scheduled start',sub:t[dr.st]||'',c:'var(--neutral-dot)'}];
      if(dr.in) events.push({time:dr.in,label:(L?'Arrivée · ':'Checked in · ')+(m?ML[m]:''),sub:outside||mock?flagReason(dr):ciDist,c:outside||mock?'var(--bad-dot)':dIn>10?'var(--warn-dot)':'var(--ok-dot)'});
      if(dr.flag) events.push({time:dr.in,label:L?'Signalé automatiquement':'Flagged automatically',sub:flagReason(dr),c:'var(--bad-dot)'});
      if(dr.offline) events.push({time:offL.slice(-5),label:L?'Synchronisé depuis le mode hors ligne':'Synced from offline mode',sub:L?'Horodatage d’origine conservé':'Original device timestamps kept',c:'var(--info-dot)'});
      if(dr.out) events.push({time:dr.out,label:L?'Départ':'Checked out',sub:coDist,c:'var(--violet-dot)'});
      if(dr.status==='missing') events.push({time:se,label:L?'Fin prévue — aucun départ':'Scheduled end — no check-out',sub:L?'Relance envoyée':'Reminder sent',c:'var(--orange-dot)'});
      if(dr.status==='absent'&&!dr.in) events.push({time:String(+ss.slice(0,2)).padStart(2,'0')+':15',label:L?'Marqué absent':'Marked absent',sub:L?'Aucun pointage 15 min après le début':'No check-in 15 min after start',c:'var(--bad-dot)'});
      histList.slice().reverse().forEach(h=>events.push({time:h.at.split(' ').pop(),label:(L?'Modifié par ':'Edited by ')+h.by,sub:h.changes.map(x=>x.k+': '+x.a+' → '+x.b).join(' · '),c:'var(--accent)'}));
      if(dr.cleared) events.push({time:'10:42',label:L?'Alerte approuvée':'Flag approved as valid',sub:me,c:'var(--ok-dot)'});
      if(dr.fraud) events.push({time:'10:42',label:L?'Fraude confirmée':'Fraud confirmed',sub:me,c:'var(--bad-dot)'});
      if(dr.approved) events.push({time:(dr.approvedAt||'').split(' ').pop(),label:(L?'Approuvé par ':'Approved by ')+dr.approved,sub:'',c:'var(--ok-dot)'});
      const pushHist=(changes,reason)=>this.setState(x=>({drHist:Object.assign({},x.drHist,{[dr.id]:(x.drHist[dr.id]||[]).concat({by:me,at:nowAt,changes,reason})})}));
      const E=s.drEdit&&s.drEdit.id===dr.id?s.drEdit:null; let ed={statusOpts:[],diffs:[]};
      if(E){ const tErr=E.mode==='times'&&E.in&&E.out&&tmx(E.out)<=tmx(E.in)&&!dr.st.includes('N'), rErr=E.tried&&!E.reason.trim();
        const diffs=E.mode==='times'?[[L?'Arrivée':'Check-in',dr.in||'—',E.in||'—'],[L?'Départ':'Check-out',dr.out||'—',E.out||'—']].filter(x=>x[1]!==x[2]):E.status!==dr.status?[[L?'Statut':'Status',chip(dr.status).label,chip(E.status).label]]:[];
        const upd=k=>e=>this.setState({drEdit:Object.assign({},this.state.drEdit,{[k]:e.target.value})});
        ed={in:E.in,out:E.out,reason:E.reason,onIn:upd('in'),onOut:upd('out'),onReason:upd('reason'),timeErr:tErr,outBd:tErr?'var(--bad-dot)':'var(--border-strong)',reasonErr:rErr,reasonBd:rErr?'var(--bad-dot)':'var(--border-strong)',
          hasDiff:diffs.length>0,diffs:diffs.map(([k,a,b])=>({k,a,b})),
          statusOpts:['ontime','late','early','absent','missing','overtime','leave','holiday'].map(k=>{const on=E.status===k,cc=chip(k);return {label:cc.label,dot:cc.dot,bd:on?'var(--accent)':'var(--border)',bg:on?'var(--accent-soft)':'var(--surface)',go:()=>this.setState({drEdit:Object.assign({},this.state.drEdit,{status:k})})};}),
          cancel:()=>this.setState({drEdit:null}),
          save:()=>{ if(tErr) return; if(!E.reason.trim()){this.setState({drEdit:Object.assign({},E,{tried:true})});return;} if(!diffs.length){this.setState({drEdit:null});return;}
            let patch;
            if(E.mode==='times'){ const ni=E.in||'', no=E.out||''; let st=dr.status;
              if(!['leave','holiday'].includes(st)&&ni){ const di=wrapD(tmx(ni),tmx(ss)), dO=no?wrapD(tmx(no),tmx(se)):0; st=di>10?'late':no&&dO<-5?'early':no&&dO>20?'overtime':!no&&day<15?'missing':'ontime'; }
              patch={in:ni,out:no,worked:ni&&no?durS(ni,no):'',status:st,edit:{by:me,at:nowAt}}; }
            else patch=Object.assign({status:E.status,edit:{by:me,at:nowAt}},['absent','leave','holiday'].includes(E.status)?{in:'',out:'',worked:''}:{});
            this.updRec(dr.id,patch); pushHist(diffs.map(([k,a,b])=>({k,a,b})),E.reason.trim()); this.setState({drEdit:null}); this.toast(L?'Pointage mis à jour':'Record updated — change saved to history'); }};
      }
      const D2=s.drDel===dr.id;
      d={L:Ld,recId:'REC-'+(dr.id<1000?'15'+String(dr.id).padStart(3,'0'):dr.id),dateL:(day===15?(L?'Aujourd’hui · ':'Today · '):'')+(L?['dim.','lun.','mar.','mer.','jeu.','ven.','sam.']:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])[new Date(2026,9,day).getDay()]+' '+day+(L?' oct. 2026':' Oct 2026'),
        name:dr.name,job:dr.job[L],siteName:site.name,branch:site.branch,empId:empIdOf(dr),av:av(dr.name),meAv:av(me),chip:chip(dr.fraud?'fraud':dr.status),sched:dr.sched,
        mIcon:MI[m]||I.att,methodShort:m?MS[m]:(L?'Pas de pointage':'No check-in'),isOffline:!!dr.offline,offlineL:offL,isApproved:!!dr.approved,approvedL:(L?'Approuvé · ':'Approved · ')+(dr.approved||''),
        hasFlag:!!dr.flag&&!dr.cleared,flagTitle:dr.fraud?(L?'Fraude confirmée':'Fraud confirmed'):(L?'Pointage signalé':'Flagged check-in'),flagDesc:dr.flag?flagReason(dr):'',
        canReview:!!dr.flag&&!dr.cleared&&!dr.fraud&&!!P.review,noPermNote:!!dr.flag&&!dr.cleared&&!dr.fraud&&!P.review,
        approveFlag:()=>{this.updRec(dr.id,{cleared:true,status:dr.lateBy?'late':'ontime'});this.toast(L?'Alerte approuvée — pointage valide':'Flag approved — check-in counted as valid');},
        rejectFlag:()=>{this.updRec(dr.id,{fraud:true});this.toast(L?'Fraude confirmée, RH notifiés':'Fraud confirmed — HR notified','bad');},
        times,editing:!!E,edTimes:!!E&&E.mode==='times',edStatus:!!E&&E.mode==='status',edTitle:E&&E.mode==='status'?Ld.changeStatus:Ld.editTimes,ed,
        openTimes:()=>this.setState({drEdit:{id:dr.id,mode:'times',in:dr.in||ss,out:dr.out||'',reason:'',tried:false}}),openStatus:()=>this.setState({drEdit:{id:dr.id,mode:'status',status:dr.status,reason:'',tried:false}}),
        fence:{r:site.r,points:site.points},noGps:!dr.in||m==='admin',ci:{x:ciX,y:ciY,c:outside||mock?'var(--bad-dot)':dIn>10?'var(--warn-dot)':'var(--ok-dot)',op:dr.in&&m!=='admin'?1:0,dist:ciDist},co:{x:coX,y:coY,op:dr.out&&m!=='admin'?1:0,dist:coDist},facts,
        hasSelfies:m==='app'&&!!dr.in,selfies:[[L?'Selfie arrivée':'Check-in selfie',dr.in]].concat(dr.out?[[L?'Selfie départ':'Check-out selfie',dr.out]]:[]).map(([label,time])=>({label,time,open:()=>this.toast(L?'Aperçu plein écran du selfie':'Selfie opens full size','info')})),
        events,hasHistory:histList.length>0,noHistory:!histList.length,history:histList,
        notes,note:s.drNote,onNote:e=>this.setState({drNote:e.target.value}),noteDisabled:!s.drNote.trim(),noteOp:s.drNote.trim()?1:.5,
        postNote:()=>{const tx=s.drNote.trim();if(!tx)return;this.setState(x=>({drNote:'',drNotes:Object.assign({},x.drNotes,{[dr.id]:(x.drNotes[dr.id]||[]).concat({by:me,at:nowAt,text:tx})})}));},
        canEdit:!!P.edit,canDelete:!!(P.admin||P.edit),canApproveRec:!!(P.review||P.edit)&&!dr.approved&&!(dr.flag&&!dr.cleared)&&!['scheduled'].includes(dr.status)&&!(!dr.in&&day===15),
        approveRec:()=>{this.updRec(dr.id,{approved:me,approvedAt:nowAt});this.toast(L?'Pointage approuvé':'Record approved');},
        showBehalf:!dr.in&&day===15&&['absent','scheduled'].includes(dr.status)&&!!P.behalf,
        behalf:()=>{this.updRec(dr.id,{in:'10:42',method:'behalf',status:'late',worked:'0m',proxyBy:me});this.toast(L?dr.name+' pointé(e) à 10:42':dr.name+' checked in at 10:42');},
        profile:()=>{this.setState({drawer:null});this.go('employees');},
        askDelete:()=>this.setState({drDel:dr.id,drDelReason:''}),confirmDel:D2,delDesc:(L?'Le pointage de ':'The record for ')+dr.name+(L?' du ':' on ')+day+(L?' oct.':' Oct')+(L?' sera retiré des rapports et de la paie. L’action reste visible dans le journal d’audit.':' will be removed from reports and payroll exports. The deletion stays visible in the audit log.'),
        delReason:s.drDelReason||'',onDelReason:e=>this.setState({drDelReason:e.target.value}),delOp:(s.drDelReason||'').trim()?1:.5,cancelDel:()=>this.setState({drDel:null}),
        doDelete:()=>{if(!(s.drDelReason||'').trim())return;this.setState(x=>({deleted:Object.assign({},x.deleted,{[dr.id]:1}),drDel:null,drawer:null,drEdit:null}));this.toast(L?'Pointage supprimé':'Record deleted','bad');}};
    }
    const rl=s.rejectId&&s.leaves.find(l=>l.id===s.rejectId);
    const otherMap={alerts:[I.alert,st.alerts],employees:[I.emp,t.employees],sites:[I.sites,st.branchesSites],schedules:[I.plan,st.schedules],reports:[I.rep,t.reports],users:[I.access,st.users],audit:[I.audit,st.audit],settings:[I.set,t.settings]};
    const allowed={sites:P.admin||P.org,reports:P.reports,users:P.admin||P.users,audit:P.admin,settings:P.admin||P.settings};
    const noAccess=s.page in allowed&&!allowed[s.page];
    let other=otherMap[s.page]; if(other&&noAccess){ other=[I.lock,st.noAccess]; t.notBuiltDesc=st.noAccessDesc; }
    const firstAbsent=recs.find(r=>!r.in&&['absent','scheduled'].includes(r.status));

    const SH=(()=>{
      const layout=this.props.layout||'auto';
      const isTablet=layout==='tablet'||(layout!=='desktop'&&s.w<1024);
      const collapsed=!isTablet&&(s.collapsed!=null?s.collapsed:this.props.sidebar==='collapsed');
      const showLabels=isTablet||!collapsed;
      const alertsN=recs.filter(r=>(r.flag&&!r.cleared&&!r.fraud)||r.status==='missing').length;
      const item=(id,icon,label,badge,badgeBg)=>{const on=s.page===id;return {label,icon,go:()=>this.go(id),current:on?'page':'false',bg:on?'var(--accent-soft)':'transparent',fg:on?'var(--accent)':'var(--text-2)',weight:on?600:500,justify:showLabels?'flex-start':'center',showLabel:showLabels,hasBadge:!!badge&&showLabels,dotBadge:!!badge&&!showLabels,badge,badgeBg:badgeBg||'var(--accent)'};};
      const navGroups=[
        {label:st.gMonitor,items:[item('dashboard',I.dash,st.overview),item('live',I.live,st.live),item('attendance',I.att,t.attendance),item('alerts',I.alert,st.alerts,alertsN,'var(--bad-dot)')]},
        {label:st.gManage,items:[item('employees',I.emp,t.employees),(P.admin||P.org)&&item('sites',I.sites,st.branchesSites),item('schedules',I.plan,st.schedules),item('leave',I.leave,t.leaveNav,pendingAll.length)].filter(Boolean)},
        {label:st.gAdmin,items:[P.reports&&item('reports',I.rep,t.reports),(P.admin||P.users)&&item('users',I.access,st.users),P.admin&&item('audit',I.audit,st.audit),P.admin&&item('settings',I.set,t.settings)].filter(Boolean)}
      ].filter(g=>g.items.length).map((g,i)=>Object.assign(g,{showLabel:showLabels,showDivider:!showLabels&&i>0}));
      const tog=k=>()=>this.setState(x=>({open:x.open===k?null:k,scopeQ:k==='scope'?'':x.scopeQ}));
      const open={scope:s.open==='scope',search:s.open==='search',notif:s.open==='notif',help:s.open==='help',user:s.open==='user'};
      const bdOn=k=>s.open===k?'var(--accent)':'var(--border)';
      // scope tree
      const canCompany=roleKey==='admin';
      const accBr=BRANCHES.filter(b=>roleKey!=='site'&&b.sites.every(x=>role0.sites.includes(x)));
      const ppl=ids=>ids.reduce((a,id)=>a+siteById[id].expected,0);
      const isSel=(tt,id)=>scope.t===tt&&(tt==='company'||scope.id===id);
      const pick=sc=>()=>this.setState({scope:sc,open:null,scopeQ:'',siteF:'all',mapSite:null});
      const plural=(n,en,fr)=>n+' '+(L?fr:en)+(n>1?'s':'');
      const mk=(o)=>Object.assign({hasToggle:false,noToggle:true,chev:'none',toggle:null,toggleTip:''},o,{bg:o.selected?'var(--accent-soft)':'transparent',weight:o.selected?600:500});
      const nodeC=tt=>tt==='company'?['var(--text)','var(--surface)']:tt==='branch'?['var(--violet-bg)','var(--violet)']:['var(--accent-soft)','var(--accent)'];
      const companyRow=ind=>{const [ib,fi]=nodeC('company');return mk({label:'Batiplus Group',sub:st.allScope+' · '+plural(role0.sites.length,'site','site')+' · '+ppl(role0.sites)+(L?' pers.':' people'),icon:I.company,ib,if:fi,indent:ind,selected:isSel('company'),go:pick({t:'company'})});};
      const branchRow=(b,ind,tree)=>{const [ib,fi]=nodeC('branch');const closed=!!s.treeClosed[b.id];return mk({label:b.name,sub:plural(b.sites.length,'site','site')+' · '+ppl(b.sites)+(L?' pers.':' people'),icon:I.branch,ib,if:fi,indent:ind,selected:isSel('branch',b.id),go:pick({t:'branch',id:b.id}),hasToggle:tree,noToggle:!tree,chev:closed?'none':'rotate(90deg)',toggleTip:closed?st.expand:st.collapse,toggle:e=>{e.stopPropagation();this.setState(x=>({treeClosed:Object.assign({},x.treeClosed,{[b.id]:!x.treeClosed[b.id]})}));}});};
      const siteRow=(id,ind,path)=>{const x=siteById[id],[ib,fi]=nodeC('site');return mk({label:x.name,sub:(path?x.branch+' · ':'')+x.expected+(L?' pers. · ':' people · ')+x.addr.split(', ').pop(),icon:I.sites,ib,if:fi,indent:ind,selected:isSel('site',id),go:pick({t:'site',id})});};
      const sq=(s.scopeQ||'').trim().toLowerCase(), sm=v=>v.toLowerCase().includes(sq);
      let scopeRows=[];
      if(!sq){
        if(canCompany) scopeRows.push(companyRow('0px'));
        const bi=canCompany?'14px':'0px', si=canCompany?'42px':'28px';
        accBr.forEach(b=>{scopeRows.push(branchRow(b,bi,true)); if(!s.treeClosed[b.id]) b.sites.forEach(id=>scopeRows.push(siteRow(id,si,false)));});
        if(roleKey==='site') role0.sites.forEach(id=>scopeRows.push(siteRow(id,'0px',true)));
      } else {
        if(canCompany&&(sm('batiplus group')||sm(st.allScope))) scopeRows.push(companyRow('0px'));
        accBr.filter(b=>sm(b.name)).forEach(b=>scopeRows.push(branchRow(b,'0px',false)));
        role0.sites.filter(id=>sm(siteById[id].name)||sm(siteById[id].addr)).forEach(id=>scopeRows.push(siteRow(id,'0px',true)));
      }
      const scBr=scope.t==='branch'?BRANCHES.find(b=>b.id===scope.id):null, scSite=scope.t==='site'?siteById[scope.id]:null;
      const scopeLabel=scope.t==='company'?st.allScope:scBr?scBr.name:scSite.name;
      const scopeKicker=scope.t==='company'?'Batiplus Group':scBr?'Batiplus Group › '+(L?'Agence':'Branch'):(roleKey==='site'?'Batiplus Group › '+scSite.branch:'Batiplus Group › '+scSite.branch);
      const [sib,sif]=nodeC(scope.t);
      // search
      const q=(s.searchQ||'').trim().toLowerCase(), qm=v=>v.toLowerCase().includes(q);
      const eAll=recs.filter(r=>!q||qm(r.name)||qm(r.job[L])||qm(siteById[r.site].name));
      const sAll=sites.filter(x=>!q||qm(x.name)||qm(x.addr)||qm(x.branch));
      const bAll=accBr.filter(b=>!q||qm(b.name));
      const lim=q?5:3;
      const searchGroups=[
        {label:q?st.gEmp:st.suggested+' · '+st.gEmp,count:eAll.length,items:eAll.slice(0,lim).map(r=>{const a=av(r.name);return {label:r.name,sub:r.job[L]+' · '+siteById[r.site].name,ini:a.ini,bg:a.bg,fg:a.fg,radius:'50%',hasIcon:false,hasChip:true,chip:chip(r.fraud?'fraud':r.status),go:()=>this.go('attendance',{drawer:r.id,status:'all',searchQ:''})};})},
        {label:st.gSites,count:sAll.length,items:sAll.slice(0,lim).map(x=>({label:x.name,sub:x.branch+' · '+x.addr,ini:'',bg:'var(--accent-soft)',fg:'var(--accent)',radius:'8px',hasIcon:true,icon:I.sites,hasChip:false,chip:{},go:()=>this.go('dashboard',{mapSite:x.id,searchQ:''})}))},
        {label:st.gBranches,count:bAll.length,items:bAll.slice(0,lim).map(b=>({label:b.name,sub:plural(b.sites.length,'site','site')+' · '+ppl(b.sites)+(L?' pers.':' people'),ini:'',bg:'var(--violet-bg)',fg:'var(--violet)',radius:'8px',hasIcon:true,icon:I.branch,hasChip:false,chip:{},go:()=>this.setState({scope:{t:'branch',id:b.id},open:null,searchQ:'',siteF:'all',mapSite:null})}))}
      ].filter(g=>g.items.length);
      // notifications
      const KIND={fraud:[I.shield,'var(--bad-bg)','var(--bad)',st.kFraud],leave:[I.leave,'var(--info-bg)','var(--info)',st.kLeave],missing:[I.logout,'var(--orange-bg)','var(--orange)',st.kMissing],uncov:[I.calx,'var(--warn-bg)','var(--warn)',st.kUncov]};
      const N=[];
      recs.filter(r=>r.flag&&!r.cleared&&!r.fraud).forEach(r=>N.push({id:'f'+r.id,kind:'fraud',title:st.nFraud+' · '+r.name,desc:r.flag==='dist'?(L?`Pointage à ${r.dist} hors du périmètre`:`Checked in ${r.dist} outside the geofence`):(L?'Localisation simulée détectée':'Mock location detected on device'),site:siteById[r.site].name,time:r.in,go:()=>this.go('attendance',{drawer:r.id,status:'all'})}));
      recs.filter(r=>r.status==='missing').forEach(r=>N.push({id:'m'+r.id,kind:'missing',title:st.nMissing+' · '+r.name,desc:L?`Fin de poste à ${r.sched.split('–')[1]}, aucun départ enregistré`:`Shift ended ${r.sched.split('–')[1]}, no check-out recorded`,site:siteById[r.site].name,time:'06:15',go:()=>this.go('attendance',{drawer:r.id,status:'all'})}));
      UNCOV.filter(u=>role.sites.includes(u.site)).forEach(u=>N.push({id:'u'+u.id,kind:'uncov',title:st.nUncov,desc:u.desc[L],site:siteById[u.site].name,time:u.time[L],go:()=>this.go('schedules')}));
      pendingAll.slice(0,3).forEach(l=>N.push({id:'l'+l.id,kind:'leave',title:st.nLeave+' · '+l.name,desc:l.type[L]+' · '+l.dates[L],site:siteById[l.site].name,time:l.sub[L],go:()=>this.go('leave',{leaveTab:'pending'})}));
      const unread=N.filter(n=>!s.readN[n.id]);
      const shown=s.notifTab==='unread'?unread:N;
      const markRead=id=>this.setState(x=>({readN:Object.assign({},x.readN,{[id]:1})}));
      const notifs=shown.map(n=>{const k=KIND[n.kind],u=!s.readN[n.id];return Object.assign({},n,{icon:k[0],ib:k[1],if:k[2],kindLabel:k[3],bg:u?'var(--accent-soft)':'transparent',weight:u?600:500,dot:u?'var(--accent)':'transparent',dotBd:u?'var(--accent)':'var(--border-strong)',readTip:u?st.markRead:st.markUnread,
        go:()=>{markRead(n.id);n.go();},toggleRead:e=>{e.stopPropagation();this.setState(x=>{const r=Object.assign({},x.readN);if(r[n.id])delete r[n.id];else r[n.id]=1;return {readN:r};});}});});
      const tabSt=on=>({bd:on?'var(--accent)':'transparent',fg:on?'var(--text)':'var(--text-3)'});
      const seg=on=>({bg:on?'var(--surface)':'transparent',fg:on?'var(--text)':'var(--text-3)',sh:on?'0 1px 2px rgba(0,0,0,.12)':'none'});
      const pref=s.themePref||theme;
      const used=84,cap=100,pct=Math.round(used/cap*100);
      const toastSoon=m=>()=>{this.setState({open:null});this.toast(m,'info');};
      return {
        isTablet,isDesk:!isTablet,showLabels,collapsedNav:!showLabels,navGroups,navJustify:showLabels?'flex-start':'center',
        sideW:isTablet?'280px':collapsed?'68px':'248px',asidePos:isTablet?'fixed':'sticky',asideZ:isTablet?60:6,asideT:isTablet&&!s.mobileNav?'translateX(-104%)':'none',asideSh:isTablet&&s.mobileNav?'var(--shadow-lg)':'none',
        navOverlay:isTablet&&s.mobileNav,openNav:()=>this.setState({mobileNav:true,open:null}),closeNav:()=>this.setState({mobileNav:false}),
        toggleCollapse:()=>this.setState({collapsed:!collapsed}),collapseLabel:collapsed?st.expand:st.collapse,collapseIcon:collapsed?I.colR:I.colL,
        showPlan:!!P.admin,plan:{name:st.planName,used:used+'/'+cap,unit:st.employeesU,pct:pct+'%',pctShort:pct+'%',c:pct>=90?'var(--bad-dot)':pct>=80?'var(--warn-dot)':'var(--accent)',tip:`${st.planName} · ${used}/${cap} ${st.employeesU}`},
        upgrade:e=>{e&&e.preventDefault&&e.preventDefault();this.props.onNavigate?this.props.onNavigate('onboarding',{step:8}):this.toast(st.upgrade,'info');},
        hdrPad:isTablet?'14px':'22px',hdrZ:s.open?40:5,mainPad:isTablet?'20px 18px 40px':'24px 28px 48px',
        anyOpen:!!s.open,closeAll:()=>this.setState({open:null}),tog:{scope:tog('scope'),search:tog('search'),notif:tog('notif'),help:tog('help'),user:tog('user')},open,
        bdScope:bdOn('scope'),bdNotif:bdOn('notif'),bdHelp:bdOn('help'),bdUser:bdOn('user'),
        scopeMax:isTablet?'230px':'280px',scopeIcon:scope.t==='company'?I.company:scope.t==='branch'?I.branch:I.sites,scopeIconBg:sib,scopeIconFg:sif,scopeKicker,scopeLabel,
        scopeQ:s.scopeQ,onScopeQ:e=>this.setState({scopeQ:e.target.value}),scopeRows,scopeEmpty:scopeRows.length===0,scopeEmptyMsg:L?`Aucun périmètre ne correspond à « ${s.scopeQ} »`:`No scopes match “${s.scopeQ}”`,scopeNote:canCompany?st.scopeNoteAll:st.scopeNoteLimited,
        searchFlex:isTablet?'none':'1',bdSearch:open.search?'var(--accent)':'var(--border)',searchRing:open.search?'0 0 0 3px var(--accent-soft)':'none',
        searchRef:this.searchRef,searchQ:s.searchQ,onSearchQ:e=>this.setState({searchQ:e.target.value,open:'search'}),openSearch:()=>{ if(this.state.open!=='search') this.setState({open:'search'}); },
        sd:isTablet?{pos:'fixed',top:'72px',left:'12px',right:'12px',w:'auto'}:{pos:'absolute',top:'calc(100% + 8px)',left:'0',right:'auto',w:'max(100%, 460px)'},
        searchGroups,searchEmpty:searchGroups.length===0,searchEmptyTitle:L?`Aucun résultat pour « ${s.searchQ} »`:`No results for “${s.searchQ}”`,searchScopeNote:(L?'Recherche dans : ':'Searching in: ')+scopeLabel,
        showDate:!isTablet,dateMain:st.today+' · '+st.dateShort,dateSub:'10:42 · Europe/Paris',tzTitle:L?'Fuseau de l’entreprise : Europe/Paris (UTC+2, CEST)':'Company timezone: Europe/Paris (UTC+2, CEST)',
        hasUnread:unread.length>0,unreadN:unread.length,noUnread:unread.length===0,markAllC:unread.length?'var(--accent)':'var(--text-3)',
        markAll:()=>this.setState(x=>{const r=Object.assign({},x.readN);N.forEach(n=>r[n.id]=1);return {readN:r};}),
        notifTabs:[['all',st.all,N.length],['unread',st.unread,unread.length]].map(([k,label,count])=>Object.assign({label,count,go:()=>this.setState({notifTab:k})},tabSt(s.notifTab===k))),
        notifs,notifEmpty:notifs.length===0,notifRight:isTablet?'-96px':'0',viewAllNotifs:()=>this.go('alerts'),
        helpItems:[[I.book,st.helpCenter],[I.kbd,st.shortcuts,'⌘K'],[I.spark,st.whatsNew,null,st.newTag],[I.chat,st.contact],[I.phone,st.mobileApp]].map(([icon,label,kbd,tag])=>({icon,label,hasKbd:!!kbd,kbd,hasTag:!!tag,tag,go:toastSoon(label)})),
        userTop:[{icon:I.user,label:st.profile,hasTag:false,go:()=>{this.setState({profTab:'profile'});this.go('profile');}},{icon:I.lock,label:st.security,hasTag:true,tag:st.twofa,go:()=>{this.setState({profTab:'security'});this.go('profile');}}],profTab:s.profTab||'profile',profRole:role0.role[L],profScope:role0.scope[L],profCanSet:!!(P.admin||P.settings),profGoSet:()=>this.go('settings'),
        langSeg:[['EN',0],['FR',1]].map(([label,v])=>Object.assign({label,go:()=>this.setState({lang:v?'fr':'en'})},seg(L===v))),
        themeSeg:[['light',st.light,I.sun],['dark',st.dark,I.moon],['system',st.system,I.monitor]].map(([k,label,icon])=>Object.assign({label,icon,go:()=>this.setState(k==='system'?{themePref:'system'}:{themePref:k,theme:k})},seg(pref===k))),
        st,me:{name:role0.name,role:role0.role[L],email:EMAILS[roleKey],av:av(role0.name)},
        outerBg:layout==='tablet'?'#C9D0DA':'transparent',outerPad:'0',frameH:layout==='tablet'?'100vh':'auto',frameOv:layout==='tablet'?'auto':'visible',frameMax:layout==='tablet'?'834px':'none',frameT:layout==='tablet'?'translateZ(0)':'none',frameR:'0',frameSh:layout==='tablet'?'0 0 0 1px rgba(13,27,46,.12),0 20px 60px rgba(13,27,46,.25)':'none'
      };
    })();

    const DB=(()=>{
      const st={}; for(const k in TD) st[k]=TD[k][L];
      const isNew=this.props.dashState==='new';
      const d=s.dbDate, isToday=d===15, vf=isToday?1:1+(((d*37)%9)-4)/60;
      const dt=n=>new Date(2026,9,n), DOW=L?['lun.','mar.','mer.','jeu.','ven.','sam.','dim.']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const MON=L?['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const fmtD=x=>DOW[(x.getDay()+6)%7]+' '+x.getDate()+' '+MON[x.getMonth()];
      const sv=x=>{const p=isToday?x.present:Math.min(x.expected,Math.round(x.present*vf));return {present:p,late:Math.round(x.late*(isToday?1:vf)),absent:Math.max(0,x.expected-p-x.leave),leave:x.leave,flagged:isToday?x.flagged:Math.round(x.flagged*vf),expected:x.expected};};
      const V=sites.map(x=>Object.assign({id:x.id,name:x.name,branch:x.branch,addr:x.addr},sv(x)));
      const sum=k=>V.reduce((a,x)=>a+x[k],0), exp=sum('expected'), fr=exp/198;
      const scopeIcon=scope.t==='company'?I.company:scope.t==='branch'?I.branch:I.sites;
      const scBr=scope.t==='branch'?BRANCHES.find(b=>b.id===scope.id):null, scSite=scope.t==='site'?siteById[scope.id]:null;
      const scopeResult=scope.t==='company'?(L?'Batiplus Group – toutes les agences':'Batiplus Group – all branches'):scBr?(L?`Agence ${scBr.name} – tous les sites`:`${scBr.name} Branch – all sites`):(L?`${scSite.name} – agence ${scSite.branch}`:`${scSite.name} – ${scSite.branch} Branch`);
      const scopeMeta=(L?`${sites.length} site${sites.length>1?'s':''} · ${exp} employés prévus`:`${sites.length} site${sites.length>1?'s':''} · ${exp} employees scheduled`);
      // KPIs
      const KD={expected:4,present:-6,late:3,absent:2,leave:-1,flagged:2,pending:1};
      const kpi=(key,label,value,dot,good,go,suffix)=>{let dd=Math.round(KD[key]*fr*(isToday?1:vf)); if(dd>0) dd=Math.min(dd,value); const up=dd>0, neu=dd===0||good==='n', ok=good==='up'?up:!up;
        return {label,value,suffix:suffix||'',dot,go,tip:label,delta:(dd>0?'+':dd<0?'−':'')+Math.abs(dd),dIcon:dd>0?'M12 19V5M5 12l7-7 7 7':dd<0?'M12 5v14M5 12l7 7 7-7':'M5 12h14',dBg:neu?'var(--neutral-bg)':ok?'var(--ok-bg)':'var(--bad-bg)',dFg:neu?'var(--text-2)':ok?'var(--ok)':'var(--bad)'};};
      const pr=sum('present');
      const kpis=[
        kpi('expected',isToday?st.kExpected:st.kExpectedPast,exp,'var(--neutral-dot)','n',()=>this.go('attendance',{status:'all'})),
        kpi('present',isToday?st.kPresent:st.kPresentPast,pr,'var(--ok-dot)','up',()=>this.go('attendance',{status:'ontime'}),Math.round(pr/exp*100)+'%'),
        kpi('late',st.kLate,sum('late'),'var(--warn-dot)','down',()=>this.go('attendance',{status:'late'})),
        kpi('absent',st.kAbsent,sum('absent'),'var(--bad-dot)','down',()=>this.go('attendance',{status:'absent'})),
        kpi('leave',st.kLeave,sum('leave'),'var(--info-dot)','n',()=>this.go('attendance',{status:'leave'})),
        kpi('flagged',st.kFlag,sum('flagged'),'var(--bad-dot)','down',()=>this.go('attendance',{status:'flagged'})),
        kpi('pending',st.kPending,pendingAll.length,'var(--warn-dot)','down',()=>this.go('leave',{leaveTab:'pending'}))
      ];
      // live pill
      const ago=s.dbTick-s.dbRefAt;
      const liveDot=React.createElement('span',{key:'ld',style:{width:8,height:8,borderRadius:'50%',background:isToday&&!s.dbPaused?'#22C55E':'#97A1B0',animation:isToday&&!s.dbPaused?'ssPulse 2s infinite':'none',flex:'none'}});
      const agoTxt=s.dbSpin?st.refreshing:s.dbPaused?st.paused.toLowerCase():ago<5?(L?'à l’instant':'just now'):(L?`il y a ${ago} s`:`updated ${ago}s ago`);
      // calendar
      const quick=[[15,st.today],[14,st.yesterday],[12,st.lastMon]];
      const calCells=[0,1,2].map(()=>({n:'',vis:'hidden',disabled:true,go:null,bg:'transparent',fg:'var(--text)',font:'400 13px Geist',cursor:'default',ring:'none'})).concat(Array.from({length:31},(_,i)=>{const n=i+1,fut=n>15,sel=n===d,tod=n===15;return {n,vis:'visible',disabled:fut,go:()=>this.setState({dbDate:n,dbOpen:null,pinOpen:null,tHover:null}),bg:sel?'var(--accent)':'transparent',fg:sel?'#fff':fut?'var(--text-3)':'var(--text)',font:(tod||sel?'600':'400')+' 13px Geist',cursor:fut?'not-allowed':'pointer',ring:tod&&!sel?'inset 0 0 0 1.5px var(--accent)':'none'};}));
      // map
      const health=x=>{const p=x.present/x.expected;let h=p>=.85?0:p>=.8?1:2;if(x.flagged&&h===0)h=1;return h;};
      const HC=['var(--ok-dot)','var(--warn-dot)','var(--bad-dot)'], HI=['M5 12l5 5L20 7','M12 6v8M12 18h.01','M18 6L6 18M6 6l12 12'];
      const pins=V.map(x=>{const h=health(x),pp=PINPOS[x.id];return {name:x.name,short:x.name.split(' ')[0].replace(/-.*/,'')==='Part'?'Part-Dieu':x.name.split(' ')[0],x:pp[0]+'%',y:pp[1]+'%',c:HC[h],icon:HI[h],count:x.present+'/'+x.expected,z:s.pinOpen===x.id?15:5,go:()=>this.setState({pinOpen:s.pinOpen===x.id?null:x.id})};});
      let pop={mav:{},stats:[]}; const px=V.find(x=>x.id===s.pinOpen);
      if(px){const pp=PINPOS[px.id],h=health(px),tx=pp[0]<28?'-14%':pp[0]>72?'-86%':'-50%',below=pp[1]<62;
        pop={name:px.name,branch:px.branch,addr:px.addr.split(', ').pop(),manager:MANAGERS[px.id],mav:av(MANAGERS[px.id]),present:px.present,expected:px.expected,pct:Math.round(px.present/px.expected*100)+'%',c:HC[h],x:pp[0]+'%',y:pp[1]+'%',tf:below?`translate(${tx}, 8px)`:`translate(${tx}, calc(-100% - 8px))`,y:below?'0%':'100%',
          stats:[{k:st.kLate,v:px.late,c:px.late?'var(--warn)':'var(--text)'},{k:st.kAbsent,v:px.absent,c:px.absent?'var(--bad)':'var(--text)'},{k:st.kFlag,v:px.flagged,c:px.flagged?'var(--bad)':'var(--text)'}],
          viewAtt:()=>this.go('attendance',{siteF:px.id,status:'all',pinOpen:null}),open:()=>this.go('sites',{pinOpen:null})};}
      // needs attention
      const done=s.dbDone, mark=(id,msg,kind)=>{this.setState(x=>({dbDone:Object.assign({},x.dbDone,{[id]:1})}));if(msg)this.toast(msg,kind);};
      const A=[], prim=(label,go)=>({label,go,bd:'0',bg:'var(--accent)',fg:'#fff'}), sec=(label,go)=>({label,go,bd:'1px solid var(--border-strong)',bg:'var(--surface)',fg:'var(--text)'});
      recs.filter(r=>r.flag&&!r.cleared&&!r.fraud).forEach(r=>A.push({id:'f'+r.id,type:'fraud',icon:I.shield,ib:'var(--bad-bg)',if:'var(--bad)',title:(L?'Pointage signalé · ':'Fraud flag · ')+r.name,desc:(r.flag==='dist'?(L?`${r.dist} hors du périmètre`:`${r.dist} outside the geofence`):(L?'Localisation simulée détectée':'Mock location detected'))+' · '+siteById[r.site].name,time:r.in,
        actions:P.review?[prim(st.review,()=>this.go('attendance',{drawer:r.id,status:'all'})),sec(st.dismiss,()=>{this.updRec(r.id,{cleared:true,status:r.lateBy?'late':'ontime'});this.toast(L?'Signalement levé':'Flag dismissed');})]:[sec(st.view,()=>this.go('attendance',{drawer:r.id,status:'all'}))]}));
      recs.filter(r=>r.status==='missing').forEach(r=>A.push({id:'m'+r.id,type:'missing',icon:I.logout,ib:'var(--orange-bg)',if:'var(--orange)',title:(L?'Sortie manquante · ':'Missing check-out · ')+r.name,desc:(L?`Fin de poste à ${r.sched.split('–')[1]}`:`Shift ended ${r.sched.split('–')[1]}`)+' · '+siteById[r.site].name,time:'06:15',
        actions:[P.edit&&prim(st.setOut,()=>{this.updRec(r.id,{out:'06:00',status:'ontime',worked:'8h 05m'});this.toast(L?`Sortie de ${r.name} enregistrée à 06:00`:`${r.name} checked out at 06:00`);}),sec(st.remind,()=>mark('m'+r.id,L?'Relance envoyée':'Reminder sent'))].filter(Boolean)}));
      UNSCHED.filter(u=>effSites.includes(u.site)).forEach(u=>A.push({id:'s'+u.id,type:'unsched',icon:I.calx,ib:'var(--violet-bg)',if:'var(--violet)',title:(L?'Pointage hors planning · ':'Unscheduled check-in · ')+u.name,desc:(L?'Aucun horaire prévu aujourd’hui':'No shift planned today')+' · '+siteById[u.site].name,time:u.time,
        actions:P.edit?[prim(st.addSched,()=>mark('s'+u.id,L?`${u.name} ajouté(e) au planning`:`${u.name} added to today’s schedule`)),sec(st.reject,()=>mark('s'+u.id,L?'Pointage refusé':'Check-in rejected','bad'))]:[sec(st.view,()=>this.go('attendance'))]}));
      pendingAll.forEach(l=>A.push({id:'l'+l.id,type:'leave',icon:I.leave,ib:'var(--info-bg)',if:'var(--info)',title:(L?'Demande de congé · ':'Leave request · ')+l.name,desc:l.type[L]+' · '+l.dates[L]+' · '+siteById[l.site].name,time:l.sub[L],
        actions:P.approve?[prim(st.approve,()=>{this.updLeave(l.id,'approved');this.toast(L?`Congé de ${l.name} approuvé`:`${l.name}’s leave approved`);}),sec(st.reject,()=>this.setState({rejectId:l.id,reason:''}))]:[sec(st.view,()=>this.go('leave'))]}));
      UNCOV.filter(u=>effSites.includes(u.site)).forEach(u=>A.push({id:'u'+u.id,type:'uncov',icon:I.userx,ib:'var(--warn-bg)',if:'var(--warn)',title:L?'Intervention sans intervenant':'Intervention without assignee',desc:u.desc[L]+' · '+siteById[u.site].name,time:u.time[L],
        actions:[prim(st.assign,()=>this.go('schedules')),sec(st.notify,()=>mark('u'+u.id,L?'Équipe prévenue':'Team notified'))]}));
      const AA=A.filter(a=>!done[a.id]);
      const tabs=[['all',st.tAll],['fraud',st.tFraud],['missing',st.tMissing],['unsched',st.tUnsched],['leave',st.tLeave],['uncov',st.tUncov]].map(([k,label])=>{const n=k==='all'?AA.length:AA.filter(a=>a.type===k).length,on=s.attnTab===k;return {k,label,count:n,go:()=>this.setState({attnTab:k}),bd:on?'var(--accent)':'var(--border)',bg:on?'var(--accent-soft)':'var(--surface)',fg:on?'var(--accent)':'var(--text-2)'};}).filter(x=>x.k==='all'||x.count>0||x.k===s.attnTab);
      const attn=s.attnTab==='all'?AA:AA.filter(a=>a.type===s.attnTab);
      // trend
      const n=s.trendR, off=(V.reduce((a,x)=>a+x.present/x.expected,0)/Math.max(1,V.length)-0.86)*40;
      const rate=i=>{const v=89.5+off+2.6*Math.sin((i+d)*0.73)+1.4*Math.sin((i+d)*2.1)-(i%13===4?3:0);return Math.max(72,Math.min(99,v));};
      const vals=Array.from({length:n},(_,j)=>rate(n-1-j)), prev=Array.from({length:n},(_,j)=>rate(2*n-1-j));
      const X=j=>n===1?0:j/(n-1)*600, Y=v=>(100-v)/30*190;
      const line=vals.map((v,j)=>(j?'L':'M')+X(j).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
      const avg=vals.reduce((a,b)=>a+b,0)/n, pavg=prev.reduce((a,b)=>a+b,0)/n, dv=avg-pavg;
      const dayOf=j=>dt(d-(n-1-j));
      const xlIdx=n===7?[0,1,2,3,4,5,6]:n===30?[0,7,14,21,29]:[0,30,60,89];
      const xl=xlIdx.map(j=>{const x=dayOf(j);return n===7?DOW[(x.getDay()+6)%7]:x.getDate()+' '+MON[x.getMonth()];});
      const h=s.tHover!=null&&s.tHover<n?s.tHover:null;
      const trend={avg:avg.toFixed(1)+'%',avgLabel:L?`moy. sur ${n} jours`:`avg. over ${n} days`,delta:(dv>=0?'+':'−')+Math.abs(dv).toFixed(1)+(L?' pt':' pts'),dBg:dv>=0?'var(--ok-bg)':'var(--bad-bg)',dFg:dv>=0?'var(--ok)':'var(--bad)',
        line,area:line+' L600 190 L0 190 Z',target:'M0 '+Y(90).toFixed(1)+' H600',targetTop:(Y(90)/1.9)+'%',yl:['100%','90%','80%','70%'],xl,
        cols:vals.map((_,j)=>({enter:()=>{ if(this.state.tHover!==j) this.setState({tHover:j}); }})),leave:()=>this.setState({tHover:null}),
        hasHover:h!=null,hx:h!=null?(X(h)/6)+'%':'0',hy:h!=null?(Y(vals[h])/1.9)+'%':'0',htf:h!=null?`translate(${X(h)<90?'0%':X(h)>510?'-100%':'-50%'}, calc(-100% - 12px))`:'none',hv:h!=null?vals[h].toFixed(1)+'%':'',hd:h!=null?fmtD(dayOf(h)):''};
      const ranges=[7,30,90].map(r=>({label:r+(L?' j':'d'),go:()=>this.setState({trendR:r,tHover:null}),bg:n===r?'var(--surface)':'transparent',fg:n===r?'var(--text)':'var(--text-3)',sh:n===r?'0 1px 2px rgba(0,0,0,.1)':'none'}));
      // methods
      const mc=[0,0,0]; V.forEach(x=>SPLIT[x.id].forEach((r,i)=>mc[i]+=x.present*r)); const mt=mc.reduce((a,b)=>a+b,0)||1; const mr=mc.map(v=>Math.round(v)); mr[0]=Math.max(0,V.reduce((a,x)=>a+x.present,0)-mr[1]-mr[2]);
      const pc=mc.map(v=>v/mt*100), gap=pc.filter(p=>p>0).length>1?0.9:0;
      const seg=(i)=>{const cum=pc.slice(0,i).reduce((a,b)=>a+b,0);return {da:Math.max(0,pc[i]-gap).toFixed(2)+' '+(100-Math.max(0,pc[i]-gap)).toFixed(2),off:(-cum).toFixed(2)};};
      const QR='M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3';
      const methods=[[st.mSelf,st.mSelfSub,I.phone,'var(--accent)','var(--accent-soft)'],[st.mProxy,st.mProxySub,'M16 11l2 2 4-4M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1','var(--violet)','var(--violet-bg)'],[st.mQr,st.mQrSub,QR,'var(--warn)','var(--warn-bg)']].map((m,i)=>({label:m[0],sub:m[1],icon:m[2],c:m[3],bg:m[4],pct:Math.round(pc[i])+'%',n:mr[i]}));
      // punctuality
      const canGroup=scope.t==='company';
      const by=canGroup?s.punctBy:'site';
      const groups=by==='branch'?BRANCHES.map(b=>{const vs=V.filter(x=>b.sites.includes(x.id));return {name:b.name,present:vs.reduce((a,x)=>a+x.present,0),late:vs.reduce((a,x)=>a+x.late,0),n:vs.length};}).filter(g=>g.n):V.map(x=>({name:x.name,present:x.present,late:x.late,n:1,branch:x.branch}));
      const punct=groups.map(g=>{const on=(g.present-g.late)/g.present*100,lt=g.late/g.present*100;return {name:g.name,sub:(by==='branch'?(L?`${g.n} site${g.n>1?'s':''} · `:`${g.n} site${g.n>1?'s':''} · `):(g.branch?g.branch+' · ':''))+g.present+(L?' présents':' present'),on:on+'%',late:lt+'%',pct:Math.round(on)+'%',c:on>=92?'var(--ok)':on>=88?'var(--warn)':'var(--bad)',tip:`${Math.round(on)}% ${st.onTimeL.toLowerCase()} · ${g.late} ${st.lateL.toLowerCase()}`,v:on};}).sort((a,b)=>b.v-a.v);
      const groupBy=[['branch',st.byBranch],['site',st.bySite]].map(([k,label])=>({label,go:()=>this.setState({punctBy:k}),bg:by===k?'var(--surface)':'transparent',fg:by===k?'var(--text)':'var(--text-3)',sh:by===k?'0 1px 2px rgba(0,0,0,.1)':'none'}));
      // stream
      const MI={self:I.phone,proxy:'M16 11l2 2 4-4M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1',qr:QR};
      const ML={self:st.mSelf,proxy:st.mProxy,qr:st.mQr};
      const base=[];
      recs.forEach(r=>{ const meth=r.method==='behalf'?'proxy':QRIDS.includes(r.id)?'qr':'self';
        const prevDay=r.st==='recurringN'&&r.in>r.sched.split('–')[1];
        if(r.in) base.push({prev:prevDay,id:'i'+r.id,name:r.name,site:r.site,act:'in',time:r.in,method:meth,status:r.fraud?'fraud':r.flag&&!r.cleared?'flagged':r.status==='late'?'late':'ontime'});
        if(r.out) base.push({id:'o'+r.id,name:r.name,site:r.site,act:'out',time:r.out,method:meth,status:r.status==='early'?'early':r.status==='overtime'?'overtime':'ontime'}); });
      const live=isToday?s.dbLive.filter(e=>effSites.includes(e.site)):[];
      const key=e=>(e.prev?'0':'1')+e.time;
      const all=live.concat(base).sort((a,b)=>key(a)<key(b)?1:key(a)>key(b)?-1:0);
      const shift=(t0)=>{ if(isToday) return t0; const [hh,mm]=t0.split(':').map(Number); const m2=hh*60+mm+((d*7)%11)-5; return String(Math.floor(m2/60)).padStart(2,'0')+':'+String(((m2%60)+60)%60).padStart(2,'0'); };
      const stream=all.slice(0,30).map(e=>({name:e.name,av:av(e.name),action:e.act==='in'?st.checkedIn:st.checkedOut,site:siteById[e.site].name,time:e.prev?(L?'hier ':'yest. ')+shift(e.time):shift(e.time),mIcon:MI[e.method],methodL:ML[e.method],chip:chip(e.status),bg:e.born&&s.dbTick-e.born<4?'var(--accent-soft)':'transparent'}));
      // new company setup
      const SU=[['company',L?'Créer l’entreprise':'Create your company',L?'Batiplus Group · Construction · Europe/Paris':'Batiplus Group · Construction · Europe/Paris',I.company,''],
        ['site',L?'Ajouter votre premier site':'Add your first site',L?'Adresse et périmètre GPS où les employés pointent':'Address and GPS geofence where employees check in',I.sites,L?'Ajouter un site':'Add site'],
        ['hours',L?'Définir les horaires':'Set working hours',L?'Jours, heures et tolérance de retard par défaut':'Default days, hours and lateness grace period',I.att,L?'Définir':'Set hours'],
        ['invite',L?'Inviter vos employés':'Invite your employees',L?'Manuellement ou par import CSV':'Add them manually or import a CSV',I.emp,L?'Inviter':'Invite'],
        ['sched',L?'Créer les plannings':'Create schedules',L?'Horaires récurrents ou interventions ponctuelles':'Recurring shifts or one-off interventions',I.plan,L?'Planifier':'Create'],
        ['app',L?'Installer l’application mobile':'Get employees on the mobile app',L?'Envoyez les liens iOS et Android par SMS':'Send iOS and Android links by SMS',I.phone,L?'Envoyer':'Send links']];
      const setupDone=SU.filter(x=>s.dbSetup[x[0]]).length, firstOpen=SU.findIndex(x=>!s.dbSetup[x[0]]);
      const setup=SU.map((x,i)=>{const dn=!!s.dbSetup[x[0]];return {title:x[1],sub:x[2],icon:x[3],cta:x[4],done:dn,notDone:!dn,bd:dn?'0':'1.5px solid var(--border-strong)',bg:dn?'var(--ok-dot)':'transparent',deco:dn?'line-through':'none',fg:dn?'var(--text-3)':'var(--text)',ctaBg:i===firstOpen?'var(--accent)':'var(--surface-2)',ctaFg:i===firstOpen?'#fff':'var(--text)',
        toggle:()=>this.setState(z=>({dbSetup:Object.assign({},z.dbSetup,{[x[0]]:!z.dbSetup[x[0]]})})),act:()=>{this.setState(z=>({dbSetup:Object.assign({},z.dbSetup,{[x[0]]:1})}));this.toast(x[1]+(L?' — terminé':' — done'));}};});
      return {st,isNew,isLiveCo:!isNew,newTitle:(L?'Bienvenue sur StaffSync, ':'Welcome to StaffSync, ')+role0.name.split(' ')[0],
        setup,setupDone,setupTotal:SU.length,setupDash:(setupDone/SU.length*97.4).toFixed(1)+' 97.4',ghostKpis:[[st.kExpected,'var(--neutral-dot)'],[st.kPresent,'var(--ok-dot)'],[st.kLate,'var(--warn-dot)'],[st.kFlag,'var(--bad-dot)']].map(([label,dot])=>({label,dot})),bookCall:()=>this.toast(L?'Lien de réservation envoyé':'Booking link sent','info'),
        scopeResult,scopeMeta,scopeIcon,scopeBg:scope.t==='company'?'var(--neutral-bg)':scope.t==='branch'?'var(--violet-bg)':'var(--accent-soft)',scopeFg:scope.t==='company'?'var(--text)':scope.t==='branch'?'var(--violet)':'var(--accent)',
        isToday,liveDot,liveDot2:liveDot,liveLabel:isToday?(s.dbPaused?st.paused:st.live):st.final,liveSub:isToday?'· '+agoTxt:'· '+st.dayClosed,liveBd:isToday&&!s.dbPaused?'rgba(34,197,94,.35)':'var(--border)',liveBg:isToday&&!s.dbPaused?'var(--ok-bg)':'var(--surface)',liveFg:isToday&&!s.dbPaused?'var(--ok)':'var(--text-2)',
        refreshTip:L?'Actualiser':'Refresh now',refresh:()=>{ if(!isToday) return; this.setState({dbSpin:true}); clearTimeout(this.spinT); this.spinT=setTimeout(()=>this.setState(z=>({dbSpin:false,dbRefAt:z.dbTick})),600); },
        dateLabel:isToday?st.today+', '+fmtD(dt(15)):fmtD(dt(d)),dateBd:s.dbOpen==='date'?'var(--accent)':'var(--border-strong)',dateOpen:s.dbOpen==='date',toggleDate:()=>this.setState({dbOpen:s.dbOpen==='date'?null:'date'}),closeDate:()=>this.setState({dbOpen:null}),
        quickDates:quick.map(([n2,label])=>({label,go:()=>this.setState({dbDate:n2,dbOpen:null,pinOpen:null}),bd:d===n2?'var(--accent)':'var(--border)',bg:d===n2?'var(--accent-soft)':'var(--surface)',fg:d===n2?'var(--accent)':'var(--text-2)'})),
        monthLabel:(L?'octobre':'October')+' 2026',dow:L?['L','M','M','J','V','S','D']:['M','T','W','T','F','S','S'],calCells,
        kpis,mapSub:(L?`${V.length} site${V.length>1?'s':''} · présents / attendus`:`${V.length} site${V.length>1?'s':''} · present / expected`),healthLegend:[[st.good,HC[0]],[st.watch,HC[1]],[st.risk,HC[2]]].map(([label,c2])=>({label,c:c2})),
        pins,hasPop:!!px,pop,closePop:()=>this.setState({pinOpen:null}),
        attn,attnTabs:tabs,attnCount:AA.length,attnEmpty:attn.length===0,
        trend,ranges,donut:{a:seg(0),b:seg(1),c:seg(2),total:mr.reduce((a,b)=>a+b,0)},methods,methodSub:isToday?(L?'Pointages d’arrivée aujourd’hui':'Today’s check-ins'):(L?'Pointages du ':'Check-ins on ')+fmtD(dt(d)),
        canGroup,groupBy,punct,punctSub:(L?'Part des arrivées à l’heure · ':'Share of on-time arrivals · ')+(isToday?st.today.toLowerCase():fmtD(dt(d))),
        stream,streamTitle:isToday?(L?'Activité en temps réel':'Real-time activity'):(L?'Activité du ':'Activity on ')+fmtD(dt(d)),streamLive:isToday&&!s.dbPaused,
        togglePause:()=>this.setState({dbPaused:!s.dbPaused}),pauseIcon:s.dbPaused?'M7 4l13 8-13 8z':'M8 5v14M16 5v14',pauseLabel:s.dbPaused?st.resume:st.pause};
    })();

    const LB=(()=>{
      const tl={}; for(const k in TL) tl[k]=TL[k][L];
      const toM=x=>{const [h,m]=x.split(':').map(Number);return h*60+m;};
      const nowM=642+Math.floor(s.lbTick/7);
      const live=r=>r.status==='leave'?'leave':r.status==='absent'?'absent':r.out?'left':r.in?'present':'not';
      const inSite=s.lbSite==='all'?recs:recs.filter(r=>r.site===s.lbSite);
      const q=s.lbQ.trim().toLowerCase(), searched=q?inSite.filter(r=>r.name.toLowerCase().includes(q)||r.job[L].toLowerCase().includes(q)):inSite;
      const isFlag=r=>!!r.flag&&!r.cleared;
      const match=r=>s.lbStatus==='all'||(s.lbStatus==='flagged'?isFlag(r):live(r)===s.lbStatus);
      const cnt=k=>inSite.filter(r=>k==='expected'?r.status!=='leave':live(r)===k).length;
      const CK=[['expected',tl.cExpected,'var(--neutral-dot)'],['present',tl.cPresent,'var(--ok-dot)'],['not',tl.cNot,'var(--warn-dot)'],['left',tl.cLeft,'var(--violet-dot)'],['absent',tl.cAbsent,'var(--bad-dot)'],['leave',tl.cLeave,'var(--info-dot)']];
      const counters=CK.map(([k,label,dot])=>{const key=k==='expected'?'all':k,on=s.lbStatus===key;return {label,dot,value:cnt(k),go:()=>this.setState({lbStatus:key}),bd:on?'var(--accent)':'var(--border)',sh:on?'0 0 0 3px var(--accent-soft)':'var(--shadow)'};});
      const chips=[['all',tl.all,null],['present',tl.cPresent,'var(--ok-dot)'],['not',tl.cNot,'var(--warn-dot)'],['left',tl.cLeft,'var(--violet-dot)'],['absent',tl.cAbsent,'var(--bad-dot)'],['leave',tl.cLeave,'var(--info-dot)'],['flagged',tl.flagged,'var(--bad-dot)']].map(([k,label,dot])=>{const on=s.lbStatus===k;return {label,hasDot:!!dot,dot,count:k==='all'?searched.length:k==='flagged'?searched.filter(isFlag).length:searched.filter(r=>live(r)===k).length,go:()=>this.setState({lbStatus:k}),bd:on?'var(--accent)':'var(--border)',bg:on?'var(--accent-soft)':'var(--surface)',fg:on?'var(--accent)':'var(--text-2)'};});
      const MI={app:I.phone,proxy:'M16 11l2 2 4-4M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1',qr:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3',admin:I.access};
      const ML={app:tl.mApp,proxy:tl.mProxy,qr:tl.mQr,admin:tl.mAdmin};
      const openM=(r,kind)=>this.setState({lbM:{id:r.id,kind,time:fmtNow(),reason:'',note:'',verified:false,tried:false}});
      const fmtNow=()=>String(Math.floor(nowM/60)).padStart(2,'0')+':'+String(nowM%60).padStart(2,'0');
      const ORD={not:0,present:1,absent:2,left:3,leave:4};
      const row=r=>{const lv=live(r),meth=r.method==='behalf'?'proxy':r.method==='qr'||(r.method==='app'&&QRIDS.includes(r.id))?'qr':r.method||'',[st0,en0]=r.sched.split('–'),late=nowM-toM(st0);
        let ch,note='';
        if(lv==='not'){ ch=late>0?{label:tl.notArrived,bg:'var(--warn-bg)',fg:'var(--warn)',dot:'var(--warn-dot)'}:chip('scheduled'); note=late>0?late+' '+tl.minLate:tl.dueAt+' '+st0; }
        else if(lv==='left') ch=r.status==='early'?chip('early'):r.status==='overtime'?chip('overtime'):{label:tl.left,bg:'var(--neutral-bg)',fg:'var(--neutral)',dot:'var(--neutral-dot)'};
        else ch=chip(r.fraud?'fraud':r.status);
        if(r.proxyBy) note=(L?'Par ':'By ')+r.proxyBy;
        const dist=!r.in?'—':r.flag==='dist'?r.dist:r.flag==='mock'?'?':((r.id*37)%40+6)+' m';
        const fresh=s.lbFresh[r.id]!=null&&s.lbTick-s.lbFresh[r.id]<5;
        return {id:r.id,ord:ORD[lv],name:r.name,job:r.job[L],av:av(r.name),sched:r.sched,schedStart:r.sched,inT:r.in||'—',outT:r.out||'—',
          inC:r.status==='late'?'var(--warn)':isFlag(r)?'var(--bad)':r.in?'var(--text)':'var(--text-3)',outC:r.status==='early'?'var(--warn)':r.status==='overtime'?'var(--violet)':r.out?'var(--text)':'var(--text-3)',
          chip:ch,hasNote:!!note,note,mIcon:MI[meth]||'',methodL:ML[meth]||'',mVis:meth?'visible':'hidden',hasFlag:isFlag(r),flagTip:r.flag==='dist'?(L?`Pointage à ${r.dist} hors du périmètre`:`Checked in ${r.dist} outside the geofence`):(L?'Localisation simulée détectée':'Mock location detected'),
          dist,distC:r.flag==='dist'&&!r.cleared?'var(--bad)':r.in?'var(--text-2)':'var(--text-3)',isFresh:fresh,bg:fresh?'var(--accent-soft)':s.lbSel[r.id]?'var(--surface-2)':'transparent',cardBd:isFlag(r)?'var(--bad-dot)':'var(--border)',
          sel:!!s.lbSel[r.id],toggleSel:()=>this.setState(x=>{const m=Object.assign({},x.lbSel);if(m[r.id])delete m[r.id];else m[r.id]=1;return {lbSel:m};}),
          canIn:!!P.behalf&&lv==='not'||(!!P.behalf&&lv==='absent'),canOut:!!P.behalf&&lv==='present',doIn:()=>openM(r,'in'),doOut:()=>openM(r,'out'),
          view:()=>this.go('attendance',{drawer:r.id,status:'all'}),callTip:(L?'Appeler ':'Call ')+PHONES[r.site]+' '+String(10+r.id),call:()=>this.toast((L?'Appel de ':'Calling ')+r.name+' · '+PHONES[r.site]+' '+String(10+r.id),'info')};};
      const shownSites=s.lbSite==='all'?sites:sites.filter(x=>x.id===s.lbSite);
      const sections=shownSites.map(x=>{const all=searched.filter(r=>r.site===x.id), rs=all.filter(match).map(row).sort((a,b)=>a.ord-b.ord), closed=!!s.lbClosed[x.id];
        const exp2=recs.filter(r=>r.site===x.id&&r.status!=='leave').length, pres=recs.filter(r=>r.site===x.id&&live(r)==='present').length, fz=FENCE[x.id];
        const ids=rs.map(r=>r.id), allSel=ids.length>0&&ids.every(id=>s.lbSel[id]);
        return {name:x.name,branch:x.branch+' · '+x.addr,manager:MANAGERS[x.id],mav:av(MANAGERS[x.id]),fence:fz[1+L],fenceTip:fz[1+L],fenceBg:`var(--${fz[0]}-bg)`,fenceFg:`var(--${fz[0]})`,fenceDot:`var(--${fz[0]}-dot)`,
          present:pres,expected:exp2,pct:(exp2?pres/exp2*100:0)+'%',rows:closed?[]:rs,isList:!closed&&rs.length>0&&s.lbView==='list',isGrid:!closed&&rs.length>0&&s.lbView==='grid',isEmpty:!closed&&rs.length===0,
          chev:closed?'none':'rotate(90deg)',hdrBd:closed?'0':'1px solid var(--border)',toggle:()=>this.setState(z=>({lbClosed:Object.assign({},z.lbClosed,{[x.id]:!z.lbClosed[x.id]})})),
          allSel,selAll:()=>this.setState(z=>{const m=Object.assign({},z.lbSel);ids.forEach(id=>{if(allSel)delete m[id];else m[id]=1;});return {lbSel:m};}),total:rs.length};}).filter(sc=>sc.total>0||(!q&&s.lbStatus==='all'));
      const selIds=Object.keys(s.lbSel).map(Number).filter(id=>recs.some(r=>r.id===id));
      const selRecs=recs.filter(r=>selIds.includes(r.id));
      const m=s.lbM, mr=m&&recs.find(r=>r.id===m.id);
      let mv={av:{},reasons:[]};
      if(mr){ const isIn=m.kind==='in', ok=!!m.reason;
        mv={av:av(mr.name),title:isIn?tl.checkIn:tl.checkOut,sub:mr.name+' · '+siteById[mr.site].name+' · '+mr.sched,time:m.time,reason:m.reason,note:m.note,verified:m.verified,
          onTime:e=>this.setState({lbM:Object.assign({},this.state.lbM,{time:e.target.value})}),onReason:e=>this.setState({lbM:Object.assign({},this.state.lbM,{reason:e.target.value})}),
          onNote:e=>this.setState({lbM:Object.assign({},this.state.lbM,{note:e.target.value})}),onVerified:e=>this.setState({lbM:Object.assign({},this.state.lbM,{verified:e.target.checked})}),
          reasons:REASONS.map(x=>({v:x[0],label:x[1+L]})),reasonBd:m.tried&&!ok?'var(--bad-dot)':'var(--border-strong)',hasErr:m.tried&&!ok,op:ok?1:.55,
          audit:L?`Enregistré comme « ${roleKey==='admin'?'Correction administrateur':'Pour un tiers'} » par ${role0.name}, visible dans le journal d’audit.`:`Recorded as “${roleKey==='admin'?'Admin correction':'Proxy'}” by ${role0.name} and visible in the audit log.`,
          cta:isIn?(L?'Pointer l’arrivée':'Check in'):(L?'Pointer le départ':'Check out'),cancel:()=>this.setState({lbM:null}),
          confirm:()=>{ if(!ok){ this.setState({lbM:Object.assign({},m,{tried:true})}); return; } const meth=roleKey==='admin'?'admin':'behalf';
            if(isIn){ const lt=toM(m.time)>toM(mr.sched.split('–')[0])+10; this.updRec(mr.id,{in:m.time,method:meth,status:lt?'late':'ontime',proxyBy:role0.name,worked:'0m'}); }
            else this.updRec(mr.id,{out:m.time,status:mr.status==='missing'||mr.status==='flagged'?mr.status==='flagged'?'flagged':'ontime':toM(m.time)<toM(mr.sched.split('–')[1])-15?'early':mr.status,proxyBy:role0.name});
            this.setState(z=>({lbM:null,drNotes:{},drEdit:null,drDel:null,drHist:{},deleted:{},drNote:'',arRange:'7d',arFrom:9,arTo:15,arBranch:'all',arSite:'all',arEmp:'',arStatus:[],arMethod:'all',arFlag:false,arOffline:false,arSort:['date','desc'],arHidden:{sched:false},arPage:1,arPer:25,arSel:{},arOpen:null,arViews:[{id:'v1',name:'Paris Nord · late',saved:true,f:{arRange:'month',arBranch:'pn',arStatus:['late']}}],arView:'all',arViewName:'',arOv:{},arManual:[],arAdd:null,lbFresh:Object.assign({},z.lbFresh,{[mr.id]:z.lbTick})}));
            this.toast(isIn?(L?`${mr.name} pointé(e) à ${m.time}`:`${mr.name} checked in at ${m.time}`):(L?`Départ de ${mr.name} pointé à ${m.time}`:`${mr.name} checked out at ${m.time}`)); }};
      }
      const views=[['list',tl.list,'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'],['grid',tl.grid,'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z']].map(([k,label,icon])=>({label,icon,go:()=>this.setState({lbView:k}),bg:s.lbView===k?'var(--surface)':'transparent',fg:s.lbView===k?'var(--text)':'var(--text-3)',sh:s.lbView===k?'0 1px 2px rgba(0,0,0,.1)':'none'}));
      const pending=LB_EV.length-s.lbEv;
      return {st:tl,dot:React.createElement('span',{key:'lbd',style:{width:8,height:8,borderRadius:'50%',background:s.lbPaused?'#97A1B0':'#22C55E',animation:s.lbPaused?'none':'ssPulse 2s infinite',flex:'none'}}),
        sub:(s.lbPaused?(L?'En pause':'Paused'):(L?'En direct':'Live'))+' · '+fmtNow()+' · '+(L?`${recs.length} employés prévus aujourd’hui`:`${recs.length} people scheduled today`),
        togglePause:()=>this.setState({lbPaused:!s.lbPaused}),pauseIcon:s.lbPaused?'M7 4l13 8-13 8z':'M8 5v14M16 5v14',pauseLabel:s.lbPaused?tl.resume:tl.pause,
        siteF:s.lbSite,onSite:e=>this.setState({lbSite:e.target.value}),siteOpts:[{id:'all',name:tl.allSites}].concat(sites.map(x=>({id:x.id,name:x.name}))),
        counters,chips,q:s.lbQ,onQ:e=>this.setState({lbQ:e.target.value}),views,sections,allEmpty:sections.length===0,clear:()=>this.setState({lbStatus:'all',lbQ:'',lbSite:'all'}),
        hasSel:selIds.length>0,selLabel:L?`${selIds.length} sélectionné${selIds.length>1?'s':''}`:`${selIds.length} selected`,padB:selIds.length?'72px':'0',canAbsent:!!P.edit,clearSel:()=>this.setState({lbSel:{}}),
        bulkRemind:()=>{const t2=selRecs.filter(r=>['not','present'].includes(live(r))).length;this.setState({lbSel:{}});this.toast(L?`Relance envoyée à ${t2} employé${t2>1?'s':''}`:`Reminder sent to ${t2} employee${t2>1?'s':''}`);},
        bulkAbsent:()=>{const tg=selRecs.filter(r=>live(r)==='not');tg.forEach(r=>this.updRec(r.id,{status:'absent'}));const sk=selRecs.length-tg.length;this.setState({lbSel:{}});this.toast((L?`${tg.length} marqué${tg.length>1?'s':''} absent${tg.length>1?'s':''}`:`${tg.length} marked absent`)+(sk?(L?` · ${sk} ignoré${sk>1?'s':''} (déjà pointé ou en congé)`:` · ${sk} skipped (already checked in or on leave)`):''),tg.length?'bad':'info');},
        mOpen:!!mr,m:mv};
    })();

    const AR=(()=>{
      const ta={}; for(const k in TA) ta[k]=TA[k][L];
      const me=role0.name, nowAt='15 Oct 10:42';
      const DOW=L?['dim.','lun.','mar.','mer.','jeu.','ven.','sam.']:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const empty=this.props.recordsState==='empty';
      const today=recs.map(r=>Object.assign({},r,{date:15,emp:r.id}));
      const all=empty?[]:today.concat(hist);
      const rng={today:[15,15],yesterday:[14,14],'7d':[9,15],month:[1,15],custom:[Math.min(s.arFrom,s.arTo),Math.max(s.arFrom,s.arTo)]}[s.arRange];
      const isFlag=r=>!!r.flag&&!r.cleared;
      const mOf=r=>r.method==='behalf'?'proxy':r.method==='qr'||(r.method==='app'&&r.date===15&&QRIDS.includes(r.id))?'qr':r.method||'';
      const stOf=r=>r.fraud?'flagged':r.status;
      const empId=r=>'EMP-'+String(100+(r.emp||r.id)*7).padStart(4,'0');
      const brOf=id=>BRANCHES.find(b=>b.sites.includes(id));
      const accBr=BRANCHES.filter(b=>b.sites.some(x=>role.sites.includes(x)));
      const q=s.arEmp.trim().toLowerCase();
      const base=all.filter(r=>!s.deleted[r.id]).filter(r=>r.date>=rng[0]&&r.date<=rng[1]&&(s.arBranch==='all'||brOf(r.site).id===s.arBranch)&&(s.arSite==='all'||r.site===s.arSite)&&(!q||r.name.toLowerCase().includes(q)||empId(r).toLowerCase().includes(q))&&(s.arMethod==='all'||mOf(r)===s.arMethod)&&(!s.arFlag||isFlag(r))&&(!s.arOffline||r.offline));
      const filtered=s.arStatus.length?base.filter(r=>s.arStatus.includes(stOf(r))):base;
      const tmv=x=>x?x:'99:99';
      const wm=r=>{if(!r.worked)return -1;const m=r.worked.match(/(\d+)h\s*(\d+)?/);return m?(+m[1])*60+(+(m[2]||0)):0;};
      const [sk,sd]=s.arSort, dir=sd==='asc'?1:-1;
      const keyF={date:r=>r.date*10000+(r.in?+r.in.replace(':',''):0),emp:r=>r.name,site:r=>siteById[r.site].name,in:r=>tmv(r.in),out:r=>tmv(r.out),worked:wm,status:r=>stOf(r),edited:r=>r.edit?r.edit.at:''}[sk];
      const sorted=filtered.slice().sort((a,b)=>{const x=keyF(a),y=keyF(b);return (x<y?-1:x>y?1:0)*dir||(b.date-a.date)||a.name.localeCompare(b.name);});
      const per=s.arPer, pagesN=Math.max(1,Math.ceil(sorted.length/per)), page=Math.min(s.arPage,pagesN);
      const pageRows=sorted.slice((page-1)*per,page*per);
      const MI={app:I.phone,proxy:'M16 11l2 2 4-4M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1',qr:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3',admin:I.access};
      const ML={app:ta.mApp,proxy:ta.mProxy,qr:ta.mQr,admin:ta.mAdmin};
      const COLS=[['date',ta.cDate],['emp',ta.cEmp],['site',ta.cSite],['sched',ta.cSched],['in',ta.cIn],['out',ta.cOut],['worked',ta.cWorked],['status',ta.cStatus],['method',ta.cMethod],['flag',ta.cFlag],['edited',ta.cEdited]];
      const col={}; COLS.forEach(([k])=>col[k]=!s.arHidden[k]);
      const selIds=Object.keys(s.arSel).map(Number);
      const rows=pageRows.map(r=>{const m=mOf(r),fl=isFlag(r)||r.fraud,ed=r.approved?{by:(L?'Approuvé · ':'Approved · ')+r.approved,at:r.approvedAt}:r.edit||(r.proxyBy?{by:r.proxyBy,at:'15 Oct'}:null);
        return {name:r.name,av:av(r.name),empId:empId(r),dateL:r.date+(L?' oct.':' Oct'),dow:r.date===15?ta.rToday:DOW[new Date(2026,9,r.date).getDay()],site:siteById[r.site].name,branch:siteById[r.site].branch,sched:r.sched,shift:t[r.st]||'',
          inT:r.in||'—',outT:r.out||(r.in&&r.date===15&&r.status!=='missing'?'…':'—'),inC:r.status==='late'?'var(--warn)':fl?'var(--bad)':r.in?'var(--text)':'var(--text-3)',outC:r.status==='early'?'var(--warn)':r.status==='overtime'?'var(--violet)':r.status==='missing'?'var(--orange)':r.out?'var(--text)':'var(--text-3)',
          worked:r.worked&&r.worked!=='—'?r.worked+(r.date===15&&!r.out&&r.in?' ·':''):'—',chip:chip(r.fraud?'fraud':r.status),mIcon:MI[m]||'',methodL:ML[m]||'',mVis:m?'visible':'hidden',offline:!!r.offline,offlineTip:L?'Enregistré hors ligne, synchronisé ensuite':'Recorded offline, synced when back online',
          hasFlag:fl,noFlag:!fl,flagBg:r.fraud?'var(--bad-dot)':'var(--bad-bg)',flagFg:r.fraud?'#fff':'var(--bad)',flagTip:r.fraud?(L?'Fraude confirmée':'Fraud confirmed'):r.flag==='dist'?(L?`${r.dist} hors du périmètre`:`${r.dist} outside the geofence`):(L?'Localisation simulée':'Mock location'),
          hasEdit:!!ed,noEdit:!ed,editBy:ed?ed.by:'',editAt:ed?ed.at:'',eav:av(ed?(ed.by.replace(/^.*· /,'')):'X'),
          sel:!!s.arSel[r.id],bg:s.arSel[r.id]?'var(--accent-soft)':s.drawer===r.id?'var(--surface-2)':'transparent',stop:e=>e.stopPropagation(),
          toggle:()=>this.setState(x=>{const z=Object.assign({},x.arSel);if(z[r.id])delete z[r.id];else z[r.id]=1;return {arSel:z};}),open:()=>this.setState({drawer:r.id})};});
      const pageIds=pageRows.map(r=>r.id), pageAllSel=pageIds.length>0&&pageIds.every(id=>s.arSel[id]);
      const sh={}; ['date','emp','site','in','out','worked','status','edited'].forEach(k=>{const on=sk===k;sh[k]={c:on?'var(--text)':'var(--text-3)',op:on?1:.35,icon:on&&sd==='asc'?'M12 19V5M5 12l7-7 7 7':'M12 5v14M5 12l7 7 7-7',go:()=>this.setState({arSort:[k,on&&sd==='desc'?'asc':'desc'],arPage:1})};});
      const tog=k=>()=>this.setState(x=>({arOpen:x.arOpen===k?null:k,arViewName:k==='save'?'':x.arViewName}));
      const open={range:s.arOpen==='range',status:s.arOpen==='status',cols:s.arOpen==='cols',export:s.arOpen==='export',save:s.arOpen==='save'};
      const RL={today:ta.rToday,yesterday:ta.rYest,'7d':ta.r7,month:ta.rMonth,custom:ta.rCustom};
      const rangeLabel=s.arRange==='custom'?`${rng[0]}–${rng[1]} ${L?'oct.':'Oct'}`:RL[s.arRange];
      const setF=p=>this.setState(Object.assign({arPage:1,arSel:{},arView:null},p));
      const defaults={arRange:'7d',arFrom:9,arTo:15,arBranch:'all',arSite:'all',arEmp:'',arStatus:[],arMethod:'all',arFlag:false,arOffline:false};
      const activeN=(s.arRange!=='7d'?1:0)+(s.arBranch!=='all'?1:0)+(s.arSite!=='all'?1:0)+(q?1:0)+(s.arStatus.length?1:0)+(s.arMethod!=='all'?1:0)+(s.arFlag?1:0)+(s.arOffline?1:0);
      const STO=['ontime','late','early','absent','missing','overtime','leave','holiday','flagged','scheduled'];
      const statusOpts=STO.map(k=>{const m2=ST[k];return {label:m2[1+L],dot:`var(--${m2[0]}-dot)`,on:s.arStatus.includes(k),count:base.filter(r=>stOf(r)===k).length,toggle:()=>setF({arStatus:s.arStatus.includes(k)?s.arStatus.filter(x=>x!==k):s.arStatus.concat(k)})};});
      const statusLabel=s.arStatus.length===1?ST[s.arStatus[0]][1+L]:ta.status;
      const VIEWS=[{id:'all',name:ta.vAll,f:defaults},{id:'flag',name:ta.vFlag,f:{arRange:'7d',arFlag:true}},{id:'missing',name:ta.vMissing,f:{arRange:'month',arStatus:['missing']}}].concat(s.arViews);
      const views=VIEWS.map(v=>{const on=s.arView===v.id;return {name:v.name,saved:!!v.saved,bd:on?'var(--accent)':'var(--border)',bg:on?'var(--accent-soft)':'var(--surface)',fg:on?'var(--accent)':'var(--text-2)',
        go:()=>this.setState(Object.assign({},defaults,v.f,{arView:v.id,arPage:1,arSel:{},arOpen:null})),del:()=>{this.setState(x=>({arViews:x.arViews.filter(y=>y.id!==v.id),arView:x.arView===v.id?null:x.arView}));this.toast(L?'Vue supprimée':'View deleted','info');}};});
      const fsnap={arRange:s.arRange,arFrom:s.arFrom,arTo:s.arTo,arBranch:s.arBranch,arSite:s.arSite,arEmp:s.arEmp,arStatus:s.arStatus,arMethod:s.arMethod,arFlag:s.arFlag,arOffline:s.arOffline};
      const summ=[rangeLabel,s.arBranch!=='all'&&BRANCHES.find(b=>b.id===s.arBranch).name,s.arSite!=='all'&&siteById[s.arSite].name,q&&'“'+s.arEmp+'”',s.arStatus.length&&s.arStatus.map(k=>ST[k][1+L]).join(', '),s.arMethod!=='all'&&ML[s.arMethod],s.arFlag&&ta.flagOnly,s.arOffline&&ta.offline].filter(Boolean).join(' · ');
      const csv=list=>{const head=['Date','Employee ID','Employee','Site','Scheduled','Check-in','Check-out','Worked','Status','Method','Flagged','Last edited by'];
        const lines=[head].concat(list.map(r=>[`2026-10-${String(r.date).padStart(2,'0')}`,empId(r),r.name,siteById[r.site].name,r.sched,r.in,r.out,r.worked,ST[r.fraud?'fraud':r.status][1],mOf(r),isFlag(r)?'yes':'',r.edit?r.edit.by:'']));
        const blob=new Blob([lines.map(l=>l.map(v=>/[",]/.test(v||'')?'"'+String(v).replace(/"/g,'""')+'"':(v||'')).join(',')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='staffsync-attendance.csv';a.click();};
      const doExport=(fmt,list)=>{this.setState({arOpen:null});if(fmt==='csv'){csv(list);this.toast(L?`${list.length} pointages exportés en CSV`:`Exported ${list.length} records as CSV`);}else this.toast(L?`Export ${fmt.toUpperCase()} de ${list.length} pointages en préparation…`:`Preparing ${fmt.toUpperCase()} of ${list.length} records — we’ll email it when ready`,'info');};
      const selRecs=all.filter(r=>s.arSel[r.id]);
      const pagesArr=[]; for(let i=1;i<=pagesN;i++){ if(i===1||i===pagesN||Math.abs(i-page)<=1) pagesArr.push(i); else if(pagesArr[pagesArr.length-1]!=='…') pagesArr.push('…'); }
      const ad2=s.arAdd; let add={results:[],siteOpts:[],statusOpts:[],files:[],sel:{av:{}},L:{}};
      if(ad2){ const La={}; for(const k in TDR) La[k]=TDR[k][L];
        const set=p=>this.setState({arAdd:Object.assign({},this.state.arAdd,p)});
        const upd=k=>e=>set({[k]:e.target.value});
        const base0=ad2.emp?RECORDS.find(r=>r.id===+ad2.emp):null;
        const qq=ad2.q.trim().toLowerCase();
        const pool=RECORDS.filter(r=>role0.sites.includes(r.site));
        const results=pool.filter(r=>!qq||r.name.toLowerCase().includes(qq)||empIdOf(r).toLowerCase().includes(qq)).slice(0,6).map(r=>({name:r.name,av:av(r.name),empId:empIdOf(r),site:siteById[r.site].name,pick:()=>set({emp:String(r.id),site:r.site,q:'',searchOpen:false,in:r.sched.split('–')[0],out:r.sched.split('–')[1]})}));
        const noT=['absent','leave','holiday'].includes(ad2.status);
        const day=+ad2.date.slice(8,10);
        const tErr=!noT&&ad2.in&&ad2.out&&tmx(ad2.out)<=tmx(ad2.in)&&!(base0&&base0.st==='recurringN');
        const inErr=ad2.tried&&!noT&&!ad2.in;
        let ov=null;
        if(base0&&day){ const ni=tmx(ad2.in), no0=ad2.out?tmx(ad2.out):ni+1, no=no0<=ni?no0+1440:no0;
          ov=all.filter(r=>!s.deleted[r.id]&&(r.emp||r.id)===base0.id&&(r.date||15)===day).find(r=>{ if(!r.in||noT) return true; const ri=tmx(r.in); let ro=r.out?tmx(r.out):tmx(r.sched.split('–')[1]); if(ro<=ri) ro+=1440; return ni<ro&&ri<no; })||null; }
        const sched=base0?base0.sched:'08:00–17:00', [ss,se]=sched.split('–');
        const auto=!ad2.in||noT?null:wrapD(tmx(ad2.in),tmx(ss))>10?'late':ad2.out&&wrapD(tmx(ad2.out),tmx(se))<-5?'early':ad2.out&&wrapD(tmx(ad2.out),tmx(se))>20?'overtime':!ad2.out&&day<15?'missing':'ontime';
        const errs=[!ad2.emp,tErr,inErr,!!ov,!ad2.reason.trim()].filter(Boolean).length;
        const fsz=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
        add={L:La,q:ad2.q,onQ:e=>set({q:e.target.value,searchOpen:true}),openSearch:()=>set({searchOpen:true}),searchOpen:!!ad2.searchOpen&&!ad2.emp,results,noResults:results.length===0,
          hasEmp:!!base0,noEmp:!base0,sel:base0?{name:base0.name,av:av(base0.name),empId:empIdOf(base0),job:base0.job[L],sched:base0.sched}:{av:{}},clearEmp:()=>set({emp:'',searchOpen:true}),
          empErr:ad2.tried&&!ad2.emp,empBd:ad2.tried&&!ad2.emp?'var(--bad-dot)':'var(--border-strong)',
          site:ad2.site||'',onSite:upd('site'),siteOpts:(ad2.site?[]:[{id:'',name:L?'Choisir un site':'Select a site'}]).concat(sites.map(x=>({id:x.id,name:x.name}))),
          date:ad2.date,onDate:upd('date'),in:ad2.in,out:ad2.out,onIn:upd('in'),onOut:upd('out'),noTimes:noT,timeBg:noT?'var(--surface-2)':'var(--surface)',
          inBd:inErr||ov?'var(--bad-dot)':'var(--border-strong)',outBd:tErr||ov?'var(--bad-dot)':'var(--border-strong)',timeErr:tErr,
          status:ad2.status,onStatus:upd('status'),statusOpts:[{id:'auto',name:(L?'Auto':'Auto')+(auto?' · '+chip(auto).label:'')}].concat(['ontime','late','early','absent','missing','overtime','leave','holiday'].map(k=>({id:k,name:chip(k).label}))),
          hint:noT?(L?'Pas d’heures pour ce statut.':'No times needed for this status.'):(L?'Prévu ':'Scheduled ')+sched+(base0?' · '+t[base0.st]:'')+(ad2.status==='auto'&&auto?' · '+(L?'statut calculé : ':'status will be ')+chip(auto).label.toLowerCase():''),
          hasOverlap:!!ov,overlapDesc:ov?(L?'Pointage existant ':'Existing record ')+(ov.in?(ov.in+'–'+(ov.out||'…')):chip(ov.status).label)+(L?' à ':' at ')+siteById[ov.site].name+(L?' le ':' on ')+day+(L?' oct. Modifiez-le plutôt que d’en créer un second.':' Oct. Edit that record instead of adding a second one.'):'',
          openOverlap:e=>{e.preventDefault();this.setState({arAdd:null,drawer:ov.id});},
          reason:ad2.reason,onReason:upd('reason'),reasonErr:ad2.tried&&!ad2.reason.trim(),reasonBd:ad2.tried&&!ad2.reason.trim()?'var(--bad-dot)':'var(--border-strong)',
          files:ad2.files.map((fl,i)=>({name:fl.name,ext:(fl.name.split('.').pop()||'').toUpperCase().slice(0,4),size:fsz(fl.size),remove:()=>set({files:ad2.files.filter((_,k)=>k!==i)})})),
          onFiles:e=>{const fs=[...(e.target.files||[])].map(x=>({name:x.name,size:x.size}));e.target.value='';if(fs.length)set({files:ad2.files.concat(fs)});},
          showSummary:ad2.tried&&errs>0,summary:L?(errs+' champ'+(errs>1?'s':'')+' à corriger'):('Fix '+errs+' issue'+(errs>1?'s':'')+' to add this record'),saveOp:ov?.5:1,
          audit:(L?'Enregistré comme saisie admin par ':'Saved as an admin entry by ')+me+(L?', visible dans le journal d’audit et l’historique du pointage.':' — visible in the audit log and the record’s edit history.'),
          cancel:()=>this.setState({arAdd:null}),
          save:()=>{ if(errs){set({tried:true});return;}
            const b=base0, id=5000+s.arManual.length, st=ad2.status==='auto'?(auto||'ontime'):ad2.status;
            const rec=Object.assign({},b,{id,emp:b.id,date:day,site:ad2.site||b.site,in:noT?'':ad2.in,out:noT?'':ad2.out,worked:!noT&&ad2.in&&ad2.out?durS(ad2.in,ad2.out):'',status:st,method:'admin',edit:{by:me,at:nowAt},manualReason:ad2.reason.trim(),evidence:ad2.files,offline:false,flag:undefined,cleared:false,fraud:false});
            this.setState(x=>({arManual:x.arManual.concat(rec),arAdd:null}));this.toast((L?'Pointage ajouté pour ':'Manual record added for ')+b.name+(ad2.files.length?(L?' · ':' · ')+ad2.files.length+(L?' justificatif(s)':' file(s) attached'):''));}};
      }
      const minW=(240+COLS.filter(([k])=>col[k]).length*100)+'px';
      return {st:ta,sub:(L?`${filtered.length} pointages · `:`${filtered.length} records · `)+rangeLabel.toLowerCase()+' · '+(scope.t==='company'?(L?'toute l’entreprise':'whole company'):scope.t==='branch'?BRANCHES.find(b=>b.id===scope.id).name:siteById[scope.id].name),
        canAdd:!!(P.edit||P.admin),openAdd:()=>this.setState({arAdd:{q:'',emp:'',site:'',date:'2026-10-15',in:'08:00',out:'17:00',status:'auto',reason:'',files:[],tried:false,searchOpen:false}}),goSchedules:()=>this.go('schedules'),
        isEmptyCo:empty,hasData:!empty,showTable:!s.loading&&!empty&&sorted.length>0,noResults:!s.loading&&!empty&&sorted.length===0,
        noResDesc:summ?(L?'Filtres actifs : ':'Active filters: ')+summ:'',
        views,tog:{range:tog('range'),status:tog('status'),cols:tog('cols'),export:tog('export'),save:tog('save')},open,anyOpen:!!s.arOpen,closeAll:()=>this.setState({arOpen:null}),
        bd:{range:s.arRange!=='7d'?'var(--accent)':'var(--border-strong)',branch:s.arBranch!=='all'?'var(--accent)':'var(--border-strong)',site:s.arSite!=='all'?'var(--accent)':'var(--border-strong)',emp:q?'var(--accent)':'var(--border)',status:s.arStatus.length?'var(--accent)':'var(--border-strong)',method:s.arMethod!=='all'?'var(--accent)':'var(--border-strong)'},
        rangeLabel,ranges:['today','yesterday','7d','month'].map(k=>({label:RL[k],hint:{today:'15 Oct',yesterday:'14 Oct','7d':'9–15 Oct',month:'1–15 Oct'}[k],bg:s.arRange===k?'var(--accent-soft)':'transparent',fg:s.arRange===k?'var(--accent)':'var(--text)',go:()=>setF({arRange:k,arOpen:null})})),
        fromV:'2026-10-'+String(s.arRange==='custom'?s.arFrom:rng[0]).padStart(2,'0'),toV:'2026-10-'+String(s.arRange==='custom'?s.arTo:rng[1]).padStart(2,'0'),
        onFrom:e=>{const v=+e.target.value.slice(8,10);if(v)setF({arRange:'custom',arFrom:v,arTo:s.arRange==='custom'?s.arTo:rng[1]});},onTo:e=>{const v=+e.target.value.slice(8,10);if(v)setF({arRange:'custom',arTo:v,arFrom:s.arRange==='custom'?s.arFrom:rng[0]});},
        multiBranch:accBr.length>1,branch:s.arBranch,onBranch:e=>setF({arBranch:e.target.value,arSite:'all'}),branchOpts:[{id:'all',name:ta.allBranches}].concat(accBr.map(b=>({id:b.id,name:b.name}))),
        multiSite:role.sites.length>1,site:s.arSite,onSite:e=>setF({arSite:e.target.value}),siteOpts:[{id:'all',name:ta.allSites}].concat(sites.filter(x=>s.arBranch==='all'||brOf(x.id).id===s.arBranch).map(x=>({id:x.id,name:x.name}))),
        emp:s.arEmp,onEmp:e=>setF({arEmp:e.target.value}),statusLabel,hasStatusN:s.arStatus.length>1,statusN:s.arStatus.length,statusOpts,statusClear:()=>setF({arStatus:[]}),
        method:s.arMethod,onMethod:e=>setF({arMethod:e.target.value}),methodOpts:[['all',ta.allMethods],['app',ta.mApp],['proxy',ta.mProxy],['qr',ta.mQr],['admin',ta.mAdmin]].map(([id,name])=>({id,name})),
        toggles:[['arFlag',ta.flagOnly],['arOffline',ta.offline]].map(([k,label])=>{const on=!!s[k];return {label,on:on?'true':'false',go:()=>setF({[k]:!on}),bd:on?'var(--accent)':'var(--border-strong)',bg:on?'var(--accent-soft)':'var(--surface)',fg:on?'var(--accent)':'var(--text)',track:on?'var(--accent)':'var(--border-strong)',knob:on?'14px':'2px'};}),
        hasActive:activeN>0,noActive:activeN===0,saveOp:activeN?1:.5,clearLabel:(L?'Tout effacer':'Clear all')+' ('+activeN+')',clearAll:()=>this.setState(Object.assign({},defaults,{arPage:1,arSel:{},arView:'all'})),
        viewName:s.arViewName,onViewName:e=>this.setState({arViewName:e.target.value}),saveSummary:summ,saveBtnOp:s.arViewName.trim()?1:.5,
        saveView:()=>{const n=s.arViewName.trim();if(!n)return;const id='v'+Date.now();this.setState(x=>({arViews:x.arViews.concat({id,name:n,saved:true,f:fsnap}),arView:id,arOpen:null}));this.toast(L?`Vue « ${n} » enregistrée`:`View “${n}” saved`);},
        colOpts:COLS.map(([k,label])=>{const locked=k==='emp';return {label,on:col[k],locked,cursor:locked?'default':'pointer',fg:locked?'var(--text-3)':'var(--text)',toggle:()=>this.setState(x=>({arHidden:Object.assign({},x.arHidden,{[k]:!x.arHidden[k]})}))};}),
        col,sh,rows,minW,pageAllSel,togglePage:()=>this.setState(x=>{const z=Object.assign({},x.arSel);pageIds.forEach(id=>{if(pageAllSel)delete z[id];else z[id]=1;});return {arSel:z};}),
        hasSel:selIds.length>0,selLabel:L?`${selIds.length} sélectionné${selIds.length>1?'s':''}`:`${selIds.length} selected`,canSelAll:pageAllSel&&sorted.length>selIds.length,selAllLabel:L?`Sélectionner les ${sorted.length} pointages`:`Select all ${sorted.length} matching`,
        selAllMatching:()=>{const z={};sorted.forEach(r=>z[r.id]=1);this.setState({arSel:z});},clearSel:()=>this.setState({arSel:{}}),
        canApprove:!!(P.review||P.edit),canAbsent:!!P.edit,
        bulkApprove:()=>{selRecs.forEach(r=>this.updRec(r.id,Object.assign({approved:me,approvedAt:nowAt},isFlag(r)?{cleared:true,status:r.lateBy?'late':'ontime'}:{})));this.setState({arSel:{}});this.toast(L?`${selRecs.length} pointage${selRecs.length>1?'s':''} approuvé${selRecs.length>1?'s':''}`:`${selRecs.length} record${selRecs.length>1?'s':''} approved`);},
        bulkAbsent:()=>{const tg=selRecs.filter(r=>r.status!=='leave'&&r.status!=='holiday');tg.forEach(r=>this.updRec(r.id,{status:'absent',in:'',out:'',worked:'',flag:undefined,edit:{by:me,at:nowAt}}));this.setState({arSel:{}});this.toast((L?`${tg.length} marqué${tg.length>1?'s':''} absent${tg.length>1?'s':''}`:`${tg.length} marked absent`)+(selRecs.length-tg.length?(L?' · congés ignorés':' · leave days skipped'):''),'bad');},
        bulkExport:()=>doExport('csv',selRecs),
        exportNote:L?`${filtered.length} pointages filtrés`:`${filtered.length} filtered records`,exports:[['csv','CSV','var(--ok-bg)','var(--ok)'],['xlsx','Excel (.xlsx)','var(--accent-soft)','var(--accent)'],['pdf','PDF','var(--bad-bg)','var(--bad)']].map(([k,label,bg,fg])=>({tag:k.toUpperCase(),label,bg,fg,go:()=>doExport(k,sorted)})),
        per:String(per),onPer:e=>this.setState({arPer:+e.target.value,arPage:1}),rangeTxt:sorted.length?`${(page-1)*per+1}–${Math.min(page*per,sorted.length)} ${L?'sur':'of'} ${sorted.length}`:'',
        pages:pagesArr.map(p=>({label:String(p),gap:p==='…',go:()=>p!=='…'&&this.setState({arPage:p}),bd:p===page?'var(--accent)':'var(--border)',bg:p===page?'var(--accent-soft)':'var(--surface)',fg:p===page?'var(--accent)':p==='…'?'var(--text-3)':'var(--text)'})),
        atFirst:page<=1,atLast:page>=pagesN,prevOp:page<=1?.4:1,nextOp:page>=pagesN?.4:1,prev:()=>this.setState({arPage:Math.max(1,page-1)}),next:()=>this.setState({arPage:Math.min(pagesN,page+1)}),
        addOpen:!!ad2,add};
    })();
    return Object.assign({db:DB,lb:LB,ar:AR,isLive:s.page==='live',
      openWorkspaces:()=>this.props.onNavigate&&this.props.onNavigate('workspaces'),
      signOut:()=>this.props.onNavigate?this.props.onNavigate('signin'):(window.location.href='/'),
      theme,t,showLabels:!compact,sideW:compact?'72px':'248px',navGroups,me:{name:role.name,role:role.role[L],av:av(role.name)},scopeLabel:role.scope[L],
      setEn:()=>this.setState({lang:'en'},()=>this.props.onLang&&this.props.onLang('en')),setFr:()=>this.setState({lang:'fr'},()=>this.props.onLang&&this.props.onLang('fr')),langEnBg:L?'transparent':'var(--accent-soft)',langEnFg:L?'var(--text-3)':'var(--accent)',langFrBg:L?'var(--accent-soft)':'transparent',langFrFg:L?'var(--accent)':'var(--text-3)',
      toggleTheme:()=>this.setState({theme:dark?'light':'dark'}),themeIcon:dark?I.sun:I.moon,
      isDash:s.page==='dashboard',isAtt:s.page==='attendance',isLeave:s.page==='leave',isSchedules:s.page==='schedules',isReports:s.page==='reports'&&!noAccess,isUsers:s.page==='users'&&!noAccess,isAudit:s.page==='audit'&&!noAccess,isSettings:s.page==='settings'&&!noAccess,isProfile:s.page==='profile',isOther:!!other&&!(s.page==='settings'&&!noAccess)&&!(s.page==='audit'&&!noAccess)&&!(s.page==='users'&&!noAccess)&&!(s.page==='reports'&&!noAccess)&&s.page!=='alerts'&&s.page!=='employees'&&s.page!=='schedules'&&!(s.page==='sites'&&!noAccess),isBranches:s.page==='sites'&&!noAccess,isEmployees:s.page==='employees',isAlerts:s.page==='alerts',otherIcon:other?other[0]:'',otherTitle:other?other[1]:'',
      greeting:t.hello+role.name.split(' ')[0],dashSub:(L?`En direct · 10:42 · ${exp} personnes prévues sur ${sites.length} site${sites.length>1?'s':''}`:`Live · 10:42 · ${exp} people scheduled across ${sites.length} site${sites.length>1?'s':''}`),
      liveDot:React.createElement('span',{style:{width:8,height:8,borderRadius:'50%',background:'#22C55E',animation:'ssPulse 2s infinite',flex:'none'}}),
      goAttendance:()=>this.go('attendance'),goLeave:e=>{e.preventDefault();this.go('leave');},goDash:()=>this.go('dashboard'),
      kpis,chart,chartTicks,pendingCount:pendingAll.length,pendingPreview:pendingAll.slice(0,4).map(leaveRow),noPending:pendingAll.length===0,canApprove:!!P.approve,
      mapTabs,mapPins,mapFence:{r:ms.r,points:ms.points},mapSite:{name:ms.name,fenceLabel:ms.fl[L],present:ms.present,expected:ms.expected,addr:ms.addr},
      attention,attnCount:attention.length,siteRows,
      canBehalf:!!P.behalf&&!!firstAbsent,openFirstAbsent:()=>firstAbsent&&this.setState({drawer:firstAbsent.id}),doExport:()=>this.toast(L?'Export CSV en préparation…':'Preparing CSV export…','info'),
      q:s.q,onQ:e=>this.setState({q:e.target.value}),multiSite:sites.length>1,siteFilter:s.siteF,onSiteFilter:e=>this.setState({siteF:e.target.value}),
      siteOptions:[{id:'all',name:t.allSites}].concat(sites.map(x=>({id:x.id,name:x.name}))),statusChips,
      loading:s.loading,skel:[1,2,3,4,5,6],showTable:!s.loading&&rows.length>0,showEmpty:!s.loading&&rows.length===0,rows,
      showingLabel:L?`${rows.length} pointages affichés · ${exp} prévus aujourd’hui`:`Showing ${rows.length} records · ${exp} scheduled today`,
      clearFilters:()=>this.setState({status:'all',siteF:'all',q:''}),
      readOnlyLeave:!P.approve,leaveTabs,leaveRows,leaveEmpty:leaveRows.length===0,
      drawerOpen:!!d,d:d||{L:{},av:{},meAv:{},chip:{},fence:{},ci:{},co:{},ed:{statusOpts:[],diffs:[]},times:[],facts:[],selfies:[],events:[],history:[],notes:[]},closeDrawer:()=>this.setState({drawer:null,drEdit:null,drDel:null}),
      modalOpen:!!rl,modalSub:rl?`${rl.name} · ${rl.type[L]} · ${rl.dates[L]}`:'',rejectReason:s.reason,onReason:e=>this.setState({reason:e.target.value}),
      rejectDisabled:!s.reason.trim(),rejectOpacity:s.reason.trim()?1:.5,closeModal:()=>this.setState({rejectId:null}),
      confirmReject:()=>{if(!rl||!s.reason.trim())return;this.updLeave(rl.id,'rejected');this.setState({rejectId:null});this.toast(L?`Demande de ${rl.name} refusée`:`${rl.name}’s request rejected`,'bad');},
      toasts:s.toasts.map(x=>({msg:x.msg,c:x.kind==='bad'?'#E5372A':x.kind==='info'?'#4F6BED':'#16A34A',icon:x.kind==='bad'?I.x:x.kind==='info'?'M12 8h.01M12 12v4':I.check}))
    },SH);
  }
}

class AdminView extends AdminBase {
  view(S) {
    const tr = this.props.tr;
    const { ad } = S;
    return (
<>
<div className="min-h-[100vh] box-border" style={{background:ad?.outerBg,padding:ad?.outerPad}}>
<div data-theme={ad?.theme} className="min-h-[100vh] m-[0_auto] bg-bg text-text flex text-[14px] leading-[1.45]" style={{height:ad?.frameH,overflow:ad?.frameOv,maxWidth:ad?.frameMax,transform:ad?.frameT,borderRadius:ad?.frameR,boxShadow:ad?.frameSh}}>
{ad?.navOverlay ? (<>
<div onClick={ad?.closeNav} className="fixed inset-[0] bg-overlay z-[59]" />
</>) : null}
<aside className="flex-none bg-sidebar border-r border-solid border-r-border flex flex-col top-[0] left-[0] h-[100vh] box-border p-[14px_12px_12px] [transition:width_.18s_ease,transform_.22s_ease]" style={{width:ad?.sideW,position:ad?.asidePos,zIndex:ad?.asideZ,transform:ad?.asideT,boxShadow:ad?.asideSh}}>
<div className="flex items-center gap-[10px] p-[2px_4px_16px]" style={{justifyContent:ad?.navJustify}}>
<div className="w-[34px] h-[34px] rounded-[9px] bg-[color:#fff] border border-solid border-border grid place-items-center flex-none overflow-hidden">
<img src="/staffsync-logo.png" alt={tr("staffsync")} className="w-[30px] h-[30px] object-contain" />
</div>
{ad?.showLabels ? (<>
<div className="font-bold text-[16px] tracking-[-.01em] flex-1">
{tr("staffsync")}
</div>
</>) : null}
{ad?.isTablet ? (<>
<button onClick={ad?.closeNav} title={ad?.st?.close} className="w-[32px] h-[32px] border border-solid border-border rounded-[8px] bg-transparent text-text-2 grid place-items-center cursor-pointer">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M18 6L6 18M6 6l12 12" />
</svg>
</button>
</>) : null}
</div>
<nav className="flex flex-col gap-[14px] flex-1 overflow-y-auto overflow-x-hidden m-[0_-4px] p-[0_4px]">
{(ad?.navGroups ?? []).map((g, $index) => (<Fragment key={$index}>
<div className="flex flex-col gap-[2px]">
{g?.showLabel ? (<>
<div className="text-[11px] font-semibold text-text-3 uppercase tracking-[.06em] p-[0_10px_6px] whitespace-nowrap">
{g?.label}
</div>
</>) : null}
{g?.showDivider ? (<>
<div className="h-[1px] bg-border m-[0_8px_10px]" />
</>) : null}
{(g?.items ?? []).map((it, $index) => (<Fragment key={$index}>
<button onClick={it?.go} title={it?.label} aria-current={it?.current} className="relative flex items-center gap-[10px] h-[36px] p-[0_10px] border-0 rounded-[8px] text-[13.5px] cursor-pointer text-left hover:text-text hover:bg-hover" style={{background:it?.bg,color:it?.fg,fontWeight:it?.weight,justifyContent:it?.justify}}>
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d={it?.icon} />
</svg>
{it?.showLabel ? (<>
<span className="flex-1 whitespace-nowrap">
{it?.label}
</span>
</>) : null}
{it?.hasBadge ? (<>
<span className="min-w-[20px] h-[20px] p-[0_6px] box-border rounded-[999px] text-[color:#fff] text-[11px] font-semibold grid place-items-center" style={{background:it?.badgeBg}}>
{it?.badge}
</span>
</>) : null}
{it?.dotBadge ? (<>
<span className="absolute top-[5px] right-[9px] min-w-[16px] h-[16px] p-[0_4px] box-border rounded-[999px] text-[color:#fff] text-[9.5px] font-bold grid place-items-center border-[2px] border-solid border-sidebar" style={{background:it?.badgeBg}}>
{it?.badge}
</span>
</>) : null}
</button>
</Fragment>))}
</div>
</Fragment>))}
</nav>
{ad?.showPlan ? (<>
{ad?.showLabels ? (<>
<div className="mt-[12px] p-[12px] border border-solid border-border rounded-[10px] bg-surface-2 flex flex-col gap-[8px]">
<div className="flex justify-between items-baseline gap-[8px]">
<span className="text-[12.5px] font-semibold whitespace-nowrap">
{ad?.plan?.name}
</span>
<a href="#" onClick={ad?.upgrade} className="text-[12px] font-medium">
{ad?.st?.upgrade}
</a>
</div>
<div className="h-[6px] rounded-[6px] bg-neutral-bg overflow-hidden">
<div className="h-[100%] rounded-[6px]" style={{width:ad?.plan?.pct,background:ad?.plan?.c}} />
</div>
<div className="text-[12px] text-text-2 whitespace-nowrap">
<span className="[font:600_12px_'Geist_Mono',monospace] text-text">
{ad?.plan?.used}
</span>
{" "}{ad?.plan?.unit}
</div>
</div>
</>) : null}
{ad?.collapsedNav ? (<>
<button onClick={ad?.upgrade} title={ad?.plan?.tip} className="mt-[10px] flex flex-col items-center gap-[5px] p-[8px_0] border border-solid border-border rounded-[10px] bg-surface-2 cursor-pointer text-text">
<span className="[font:600_11px_'Geist_Mono',monospace]">
{ad?.plan?.pctShort}
</span>
<span className="w-[28px] h-[4px] rounded-[4px] bg-neutral-bg overflow-hidden block">
<span className="block h-[100%]" style={{width:ad?.plan?.pct,background:ad?.plan?.c}} />
</span>
</button>
</>) : null}
</>) : null}
{ad?.isDesk ? (<>
<button onClick={ad?.toggleCollapse} title={ad?.collapseLabel} className="mt-[8px] flex items-center gap-[10px] h-[34px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-text-3 text-[13px] font-medium cursor-pointer hover:bg-hover hover:text-text" style={{justifyContent:ad?.navJustify}}>
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d={ad?.collapseIcon} />
</svg>
{ad?.showLabels ? (<>
<span className="whitespace-nowrap">
{ad?.collapseLabel}
</span>
</>) : null}
</button>
</>) : null}
</aside>
<div className="flex-1 min-w-[0] flex flex-col">
<header className="h-[64px] flex-none flex items-center gap-[10px] border-b border-solid border-b-border bg-surface sticky top-[0]" style={{padding:`0 ${ad?.hdrPad}`,zIndex:ad?.hdrZ}}>
{ad?.anyOpen ? (<>
<div onClick={ad?.closeAll} className="fixed inset-[0] z-[0]" />
</>) : null}
{ad?.isTablet ? (<>
<button onClick={ad?.openNav} title={ad?.st?.menu} aria-label={ad?.st?.menu} className="w-[38px] h-[38px] border border-solid border-border rounded-[10px] bg-surface text-text-2 grid place-items-center cursor-pointer relative z-[1]">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M4 6h16M4 12h16M4 18h16" />
</svg>
</button>
</>) : null}
<div className="relative z-[1] min-w-[0]">
<button onClick={ad?.tog?.scope} className="flex items-center gap-[10px] h-[42px] p-[0_10px_0_6px] rounded-[10px] bg-surface text-text cursor-pointer box-border hover:bg-hover" style={{border:`1px solid ${ad?.bdScope}`,maxWidth:ad?.scopeMax}}>
<span className="w-[30px] h-[30px] rounded-[8px] grid place-items-center flex-none" style={{background:ad?.scopeIconBg,color:ad?.scopeIconFg}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
<path d={ad?.scopeIcon} />
</svg>
</span>
<span className="flex flex-col items-start leading-[1.2] min-w-[0] text-left">
<span className="text-[11px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-[100%]">
{ad?.scopeKicker}
</span>
<span className="text-[13.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[100%]">
{ad?.scopeLabel}
</span>
</span>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 flex-none">
<path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
</svg>
</button>
{ad?.open?.scope ? (<>
<div className="absolute top-[calc(100%_+_8px)] bg-surface border border-solid border-border rounded-[12px] shadow-pop z-[2] [animation:ssIn_.14s_ease-out] overflow-hidden left-[0] w-[340px] max-w-[calc(100vw_-_32px)] flex flex-col">
<div className="p-[10px] border-b border-solid border-b-border">
<div className="flex items-center gap-[8px] h-[36px] p-[0_10px] border border-solid border-border-strong rounded-[9px] text-text-3">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
</svg>
<input value={ad?.scopeQ} onChange={ad?.onScopeQ} autoFocus={true} placeholder={ad?.st?.scopeSearch} className="flex-1 min-w-[0] border-0 [outline:0] bg-transparent text-text text-[13.5px]" />
</div>
</div>
<div className="max-h-[360px] overflow-auto p-[6px]">
{(ad?.scopeRows ?? []).map((sr, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[2px]" style={{paddingLeft:sr?.indent}}>
{sr?.hasToggle ? (<>
<button onClick={sr?.toggle} title={sr?.toggleTip} className="w-[22px] h-[22px] border-0 rounded-[6px] bg-transparent text-text-3 grid place-items-center cursor-pointer flex-none p-[0] hover:bg-hover">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="[transition:transform_.15s]" style={{transform:sr?.chev}}>
<path d="M9 6l6 6-6 6" />
</svg>
</button>
</>) : null}
{sr?.noToggle ? (<>
<span className="w-[22px] flex-none" />
</>) : null}
<button onClick={sr?.go} className="flex-1 min-w-[0] flex items-center gap-[10px] p-[7px_8px] border-0 rounded-[8px] text-text cursor-pointer text-left hover:bg-hover" style={{background:sr?.bg}}>
<span className="w-[26px] h-[26px] rounded-[7px] grid place-items-center flex-none" style={{background:sr?.ib,color:sr?.if}}>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
<path d={sr?.icon} />
</svg>
</span>
<span className="flex-1 min-w-[0]">
<span className="block text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis" style={{fontWeight:sr?.weight}}>
{sr?.label}
</span>
<span className="block text-[11.5px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{sr?.sub}
</span>
</span>
{sr?.selected ? (<>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="text-accent flex-none">
<path d="M5 12l5 5L20 7" />
</svg>
</>) : null}
</button>
</div>
</Fragment>))}
{ad?.scopeEmpty ? (<>
<div className="p-[20px_12px] text-center text-[13px] text-text-3">
{ad?.scopeEmptyMsg}
</div>
</>) : null}
</div>
<div className="flex items-center gap-[8px] p-[10px_12px] border-t border-solid border-t-border bg-surface-2 text-[12px] text-text-3">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />
</svg>
{ad?.scopeNote}
</div>
</div>
</>) : null}
</div>
<div className="relative z-[1] max-w-[460px] min-w-[0]" style={{flex:ad?.searchFlex}}>
{ad?.isDesk ? (<>
<div className="flex items-center gap-[8px] h-[40px] p-[0_8px_0_12px] rounded-[10px] bg-surface-2 text-text-3" style={{border:`1px solid ${ad?.bdSearch}`,boxShadow:ad?.searchRing}}>
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
</svg>
<input ref={ad?.searchRef} value={ad?.searchQ} onChange={ad?.onSearchQ} onFocus={ad?.openSearch} placeholder={ad?.st?.search} className="flex-1 min-w-[0] border-0 [outline:0] bg-transparent text-text text-[13.5px]" />
<span className="[font:500_11px_'Geist_Mono',monospace] p-[2px_6px] border border-solid border-border rounded-[5px] bg-surface whitespace-nowrap">
{tr("k")}
</span>
</div>
</>) : null}
{ad?.isTablet ? (<>
<button onClick={ad?.tog?.search} title={ad?.st?.searchShort} className="w-[38px] h-[38px] border border-solid border-border rounded-[10px] bg-surface text-text-2 grid place-items-center cursor-pointer relative">
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
</svg>
</button>
</>) : null}
{ad?.open?.search ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-pop z-[2] [animation:ssIn_.14s_ease-out] overflow-hidden" style={{position:ad?.sd?.pos,top:ad?.sd?.top,left:ad?.sd?.left,right:ad?.sd?.right,width:ad?.sd?.w}}>
{ad?.isTablet ? (<>
<div className="p-[10px] border-b border-solid border-b-border">
<div className="flex items-center gap-[8px] h-[40px] p-[0_10px] border border-solid border-accent rounded-[9px] text-text-3">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
</svg>
<input ref={ad?.searchRef} value={ad?.searchQ} onChange={ad?.onSearchQ} autoFocus={true} placeholder={ad?.st?.search} className="flex-1 min-w-[0] border-0 [outline:0] bg-transparent text-text text-[14px]" />
</div>
</div>
</>) : null}
<div className="max-h-[440px] overflow-auto p-[4px_0_6px]">
{(ad?.searchGroups ?? []).map((sg, $index) => (<Fragment key={$index}>
<div className="flex justify-between p-[10px_14px_4px] text-[11px] font-semibold text-text-3 uppercase tracking-[.06em]">
<span>
{sg?.label}
</span>
<span className="[font-family:'Geist_Mono',monospace]">
{sg?.count}
</span>
</div>
{(sg?.items ?? []).map((sx, $index) => (<Fragment key={$index}>
<button onClick={sx?.go} className="flex items-center gap-[12px] w-[100%] p-[8px_14px] border-0 bg-transparent text-text cursor-pointer text-left hover:bg-hover">
<span className="w-[30px] h-[30px] grid place-items-center text-[11.5px] font-semibold flex-none" style={{borderRadius:sx?.radius,background:sx?.bg,color:sx?.fg}}>
{sx?.ini}
{sx?.hasIcon ? (<>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
<path d={sx?.icon} />
</svg>
</>) : null}
</span>
<span className="flex-1 min-w-[0]">
<span className="block text-[13.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
{sx?.label}
</span>
<span className="block text-[12px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{sx?.sub}
</span>
</span>
{sx?.hasChip ? (<>
<span className="inline-flex items-center gap-[5px] p-[2px_8px] rounded-[999px] text-[11.5px] font-medium whitespace-nowrap" style={{background:sx?.chip?.bg,color:sx?.chip?.fg}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:sx?.chip?.dot}} />
{sx?.chip?.label}
</span>
</>) : null}
</button>
</Fragment>))}
</Fragment>))}
{ad?.searchEmpty ? (<>
<div className="p-[28px_16px] text-center">
<div className="font-semibold text-[13.5px]">
{ad?.searchEmptyTitle}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{ad?.st?.searchEmptyDesc}
</div>
</div>
</>) : null}
</div>
<div className="flex items-center gap-[8px] p-[9px_14px] border-t border-solid border-t-border bg-surface-2 text-[12px] text-text-3">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />
</svg>
<span>
{ad?.searchScopeNote}
</span>
</div>
</div>
</>) : null}
</div>
<div className="flex-1" />
{ad?.showDate ? (<>
<div title={ad?.tzTitle} className="flex items-center gap-[9px] h-[40px] p-[0_12px] border border-solid border-border rounded-[10px] whitespace-nowrap text-text-2">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" />
</svg>
<span className="flex flex-col leading-[1.2]">
<span className="text-[13px] font-semibold text-text">
{ad?.dateMain}
</span>
<span className="text-[11px] text-text-3">
{ad?.dateSub}
</span>
</span>
</div>
</>) : null}
<div className="relative z-[1]">
<button onClick={ad?.tog?.notif} title={ad?.st?.notifs} aria-label={ad?.st?.notifs} className="w-[38px] h-[38px] border border-solid border-border rounded-[10px] bg-surface text-text-2 grid place-items-center cursor-pointer relative hover:bg-hover" style={{borderColor:ad?.bdNotif}}>
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" />
</svg>
{ad?.hasUnread ? (<>
<span className="absolute top-[-5px] right-[-5px] min-w-[18px] h-[18px] p-[0_5px] box-border rounded-[999px] bg-bad-dot text-[color:#fff] text-[10.5px] font-bold grid place-items-center border-[2px] border-solid border-surface">
{ad?.unreadN}
</span>
</>) : null}
</button>
{ad?.open?.notif ? (<>
<div className="absolute top-[calc(100%_+_8px)] bg-surface border border-solid border-border rounded-[12px] shadow-pop z-[2] [animation:ssIn_.14s_ease-out] overflow-hidden w-[400px] max-w-[calc(100vw_-_24px)] flex flex-col" style={{right:ad?.notifRight}}>
<div className="flex items-center justify-between gap-[10px] p-[14px_16px_0]">
<span className="font-semibold text-[15px]">
{ad?.st?.notifs}
</span>
<button onClick={ad?.markAll} disabled={ad?.noUnread} className="border-0 bg-transparent text-[12.5px] font-medium cursor-pointer p-[4px_0]" style={{color:ad?.markAllC}}>
{ad?.st?.markAll}
</button>
</div>
<div className="flex gap-[18px] p-[0_16px] border-b border-solid border-b-border mt-[8px]">
{(ad?.notifTabs ?? []).map((nt, $index) => (<Fragment key={$index}>
<button onClick={nt?.go} className="border-0 bg-transparent p-[8px_0_9px] mb-[-1px] text-[13px] font-medium cursor-pointer flex gap-[6px] items-center" style={{borderBottom:`2px solid ${nt?.bd}`,color:nt?.fg}}>
{nt?.label}
<span className="[font:500_11px_'Geist_Mono',monospace] p-[0_6px] rounded-[999px] bg-neutral-bg text-text-2">
{nt?.count}
</span>
</button>
</Fragment>))}
</div>
<div className="max-h-[400px] overflow-auto">
{(ad?.notifs ?? []).map((n, $index) => (<Fragment key={$index}>
<div onClick={n?.go} className="flex gap-[12px] p-[12px_16px] border-b border-solid border-b-border cursor-pointer hover:bg-hover" style={{background:n?.bg}}>
<span className="w-[32px] h-[32px] rounded-[9px] grid place-items-center flex-none" style={{background:n?.ib,color:n?.if}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d={n?.icon} />
</svg>
</span>
<div className="flex-1 min-w-[0]">
<div className="flex gap-[8px] items-baseline">
<span className="flex-1 text-[13px]" style={{fontWeight:n?.weight}}>
{n?.title}
</span>
<span className="[font:400_11.5px_'Geist_Mono',monospace] text-text-3 whitespace-nowrap">
{n?.time}
</span>
</div>
<div className="text-[12.5px] text-text-2 mt-[1px]">
{n?.desc}
</div>
<div className="flex items-center gap-[6px] text-[11.5px] text-text-3 mt-[4px]">
<span className="p-[1px_7px] rounded-[999px] font-semibold" style={{background:n?.ib,color:n?.if}}>
{n?.kindLabel}
</span>
{n?.site}
</div>
</div>
<button onClick={n?.toggleRead} title={n?.readTip} className="w-[24px] h-[24px] border-0 rounded-[6px] bg-transparent grid place-items-center cursor-pointer self-center flex-none p-[0] hover:bg-neutral-bg">
<span className="w-[8px] h-[8px] rounded-[50%] box-border" style={{background:n?.dot,border:`1.5px solid ${n?.dotBd}`}} />
</button>
</div>
</Fragment>))}
{ad?.notifEmpty ? (<>
<div className="p-[36px_16px] text-center">
<div className="w-[40px] h-[40px] m-[0_auto_10px] rounded-[50%] bg-ok-bg text-ok grid place-items-center">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M5 12l5 5L20 7" />
</svg>
</div>
<div className="font-semibold">
{ad?.st?.caughtUp}
</div>
<div className="text-[12.5px] text-text-3">
{ad?.st?.caughtUpDesc}
</div>
</div>
</>) : null}
</div>
<button onClick={ad?.viewAllNotifs} className="h-[42px] border-0 bg-surface-2 text-accent text-[13px] font-semibold cursor-pointer hover:bg-hover">
{ad?.st?.viewAllNotifs}
</button>
</div>
</>) : null}
</div>
<div className="relative z-[1]">
<button onClick={ad?.tog?.help} title={ad?.st?.help} aria-label={ad?.st?.help} className="w-[38px] h-[38px] border border-solid border-border rounded-[10px] bg-surface text-text-2 grid place-items-center cursor-pointer relative hover:bg-hover" style={{borderColor:ad?.bdHelp}}>
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
</svg>
</button>
{ad?.open?.help ? (<>
<div className="absolute top-[calc(100%_+_8px)] bg-surface border border-solid border-border rounded-[12px] shadow-pop z-[2] [animation:ssIn_.14s_ease-out] overflow-hidden right-[0] w-[280px] p-[6px]">
{(ad?.helpItems ?? []).map((h, $index) => (<Fragment key={$index}>
<button onClick={h?.go} className="flex items-center gap-[10px] w-[100%] h-[38px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-text text-[13.5px] cursor-pointer text-left hover:bg-hover">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 flex-none">
<path d={h?.icon} />
</svg>
<span className="flex-1">
{h?.label}
</span>
{h?.hasKbd ? (<>
<span className="[font:500_11px_'Geist_Mono',monospace] p-[2px_6px] border border-solid border-border rounded-[5px] text-text-3">
{h?.kbd}
</span>
</>) : null}
{h?.hasTag ? (<>
<span className="text-[10.5px] font-semibold p-[2px_7px] rounded-[999px] bg-accent-soft text-accent">
{h?.tag}
</span>
</>) : null}
</button>
</Fragment>))}
<div className="flex items-center gap-[8px] m-[6px_-6px_-6px] p-[10px_16px] border-t border-solid border-t-border bg-surface-2 text-[12px] text-text-3">
<span className="w-[7px] h-[7px] rounded-[50%] bg-ok-dot" />
{ad?.st?.status}
<span className="ml-[auto] [font-family:'Geist_Mono',monospace]">
{tr("v4_2_1")}
</span>
</div>
</div>
</>) : null}
</div>
<div className="relative z-[1]">
<button onClick={ad?.tog?.user} aria-label={ad?.st?.account} className="flex items-center gap-[6px] h-[40px] p-[0_6px_0_4px] rounded-[999px] bg-surface cursor-pointer text-text-3 hover:bg-hover" style={{border:`1px solid ${ad?.bdUser}`}}>
<span className="w-[32px] h-[32px] rounded-[50%] grid place-items-center text-[12px] font-semibold" style={{background:ad?.me?.av?.bg,color:ad?.me?.av?.fg}}>
{ad?.me?.av?.ini}
</span>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M6 9l6 6 6-6" />
</svg>
</button>
{ad?.open?.user ? (<>
<div className="absolute top-[calc(100%_+_8px)] bg-surface border border-solid border-border rounded-[12px] shadow-pop z-[2] [animation:ssIn_.14s_ease-out] overflow-hidden right-[0] w-[300px]">
<div className="flex gap-[12px] items-center p-[14px_16px] border-b border-solid border-b-border">
<span className="w-[40px] h-[40px] rounded-[50%] grid place-items-center text-[14px] font-semibold flex-none" style={{background:ad?.me?.av?.bg,color:ad?.me?.av?.fg}}>
{ad?.me?.av?.ini}
</span>
<div className="min-w-[0]">
<div className="font-semibold">
{ad?.me?.name}
</div>
<div className="text-[12px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{ad?.me?.email}
</div>
<div className="mt-[4px]">
<span className="text-[11px] font-semibold p-[2px_7px] rounded-[999px] bg-accent-soft text-accent">
{tr("p0_batiplus_group",{p0:ad?.me?.role ?? ''})}
</span>
</div>
</div>
</div>
<div className="p-[6px]">
{(ad?.userTop ?? []).map((u, $index) => (<Fragment key={$index}>
<button onClick={u?.go} className="flex items-center gap-[10px] w-[100%] h-[38px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-text text-[13.5px] cursor-pointer text-left hover:bg-hover">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 flex-none">
<path d={u?.icon} />
</svg>
<span className="flex-1">
{u?.label}
</span>
{u?.hasTag ? (<>
<span className="text-[11px] font-semibold p-[2px_7px] rounded-[999px] bg-ok-bg text-ok">
{u?.tag}
</span>
</>) : null}
</button>
</Fragment>))}
</div>
<div className="p-[10px_16px] border-t border-solid border-t-border flex flex-col gap-[10px]">
<div className="flex items-center justify-between gap-[10px]">
<span className="flex items-center gap-[10px] text-[13.5px]">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
</svg>
{ad?.st?.language}
</span>
<div className="flex p-[2px] border border-solid border-border rounded-[8px] gap-[2px] bg-surface-2">
{(ad?.langSeg ?? []).map((ls, $index) => (<Fragment key={$index}>
<button onClick={ls?.go} className="border-0 h-[26px] p-[0_10px] rounded-[6px] text-[12px] font-semibold cursor-pointer" style={{background:ls?.bg,color:ls?.fg,boxShadow:ls?.sh}}>
{ls?.label}
</button>
</Fragment>))}
</div>
</div>
<div className="flex items-center justify-between gap-[10px]">
<span className="flex items-center gap-[10px] text-[13.5px]">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 3a9 9 0 1 0 9 9A7 7 0 0 1 12 3z" />
</svg>
{ad?.st?.theme}
</span>
<div className="flex p-[2px] border border-solid border-border rounded-[8px] gap-[2px] bg-surface-2">
{(ad?.themeSeg ?? []).map((ts, $index) => (<Fragment key={$index}>
<button onClick={ts?.go} title={ts?.label} className="border-0 h-[26px] w-[32px] rounded-[6px] cursor-pointer grid place-items-center" style={{background:ts?.bg,color:ts?.fg,boxShadow:ts?.sh}}>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
<path d={ts?.icon} />
</svg>
</button>
</Fragment>))}
</div>
</div>
</div>
<div className="p-[6px] border-t border-solid border-t-border">
<button onClick={ad?.openWorkspaces} className="flex items-center gap-[10px] w-[100%] h-[38px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-text text-[13.5px] cursor-pointer text-left hover:bg-hover">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
</svg>
<span className="flex-1">
{ad?.st?.switchWs}
</span>
<span className="text-[12px] text-text-3">
{"5"}
</span>
</button>
<button onClick={ad?.signOut} className="flex items-center gap-[10px] w-[100%] h-[38px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-bad text-[13.5px] cursor-pointer text-left hover:bg-bad-bg">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
</svg>
<span>
{ad?.st?.signOut}
</span>
</button>
</div>
</div>
</>) : null}
</div>
</header>
<main className="flex-1 box-border max-w-[1480px] w-[100%]" style={{padding:ad?.mainPad}}>
{ad?.isDash ? (<>
<AdminDashboard ad={ad} />
</>) : null}
{ad?.isLive ? (<>
<AdminLive ad={ad} />
</>) : null}
{ad?.isAtt ? (<>
<AdminAttendance ad={ad} />
</>) : null}
{ad?.isLeave ? (<>
<AdminLeaveInbox  />
</>) : null}
{ad?.isAlerts ? (<>
<AdminAlerts ad={ad} />
</>) : null}
{ad?.isEmployees ? (<>
<AdminEmployees ad={ad} />
</>) : null}
{ad?.isBranches ? (<>
<AdminBranches ad={ad} />
</>) : null}
{ad?.isProfile ? (<>
<AdminProfile tab={ad?.profTab} roleName={ad?.profRole} scope={ad?.profScope} canSettings={ad?.profCanSet} onOpenSettings={ad?.profGoSet} />
</>) : null}
{ad?.isSettings ? (<>
<AdminSettings  />
</>) : null}
{ad?.isAudit ? (<>
<AdminAuditLog  />
</>) : null}
{ad?.isUsers ? (<>
<AdminUsers  />
</>) : null}
{ad?.isReports ? (<>
<AdminReports  />
</>) : null}
{ad?.isSchedules ? (<>
<AdminSchedules  />
</>) : null}
{ad?.isOther ? (<>
<AdminOther ad={ad} />
</>) : null}
</main>
</div>
{ad?.drawerOpen ? (<>
<AdminDrawer ad={ad} />
</>) : null}
{ad?.modalOpen ? (<>
<div className="fixed inset-[0] bg-overlay z-[30] grid place-items-center p-[20px]">
<div className="w-[440px] max-w-[100%] bg-surface border border-solid border-border rounded-[14px] shadow-pop [animation:ssIn_.18s_ease-out]">
<div className="p-[20px_22px_0]">
<div className="font-semibold text-[16px]">
{ad?.t?.rejectTitle}
</div>
<div className="text-[13px] text-text-2 mt-[4px]">
{ad?.modalSub}
</div>
<div className="text-[12.5px] text-text-3 mt-[10px]">
{ad?.t?.rejectDesc}
</div>
<textarea value={ad?.rejectReason} onChange={ad?.onReason} placeholder={ad?.t?.reasonPh} rows="3" className="w-[100%] box-border mt-[12px] p-[10px_12px] border border-solid border-border-strong rounded-[9px] bg-surface text-text [font:inherit] text-[13.5px] resize-y [outline-color:var(--accent)]" />
</div>
<div className="flex justify-end gap-[8px] p-[16px_22px_18px]">
<button onClick={ad?.closeModal} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:500_13px_'Geist',sans-serif] cursor-pointer">
{ad?.t?.cancel}
</button>
<button onClick={ad?.confirmReject} disabled={ad?.rejectDisabled} className="h-[36px] p-[0_14px] rounded-[9px] border-0 bg-bad-dot text-[color:#fff] [font:500_13px_'Geist',sans-serif] cursor-pointer" style={{opacity:ad?.rejectOpacity}}>
{ad?.t?.confirmReject}
</button>
</div>
</div>
</div>
</>) : null}
<div className="fixed right-[20px] bottom-[20px] z-[40] flex flex-col gap-[8px] items-end">
{(ad?.toasts ?? []).map((tt, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] min-w-[280px] max-w-[380px] p-[12px_14px] rounded-[11px] bg-text text-surface shadow-pop text-[13.5px] [animation:ssIn_.2s_ease-out]">
<span className="w-[20px] h-[20px] rounded-[50%] grid place-items-center flex-none text-[color:#fff]" style={{background:tt?.c}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
<path d={tt?.icon} />
</svg>
</span>
<span className="flex-1">
{tt?.msg}
</span>
</div>
</Fragment>))}
</div>
</div>
</div>
</>
    );
  }
}

export default function Admin(props: any) {
  const tr = useTranslations('Admin');
  return <AdminView {...props} tr={tr} />;
}
