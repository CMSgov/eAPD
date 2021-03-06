import NoMatch from './components/NoMatch';
import Dashboard from './containers/Dashboard';
import ApdApplication from './containers/ApdApplication';
import ApdViewOnly from './containers/viewOnly/Apd';
import LoginApplication from './containers/LoginApplication';
import ManageAccount from './containers/admin/ManageAccount';
import StateAdmin from './containers/admin/StateAdmin';
import SelectAffiliation from './containers/SelectAffiliation';
import Logout from './containers/Logout';

const routes = [
  { path: '/', component: Dashboard, exact: true, isPublic: false },
  {
    path: '/apd/:apdId',
    component: ApdApplication,
    exact: false,
    isPublic: false
  },
  {
    path: '/print/:apdId',
    component: ApdViewOnly,
    exact: true,
    isPublic: false
  },
  { path: '/login', component: LoginApplication, isPublic: true, isCard: true },
  { path: '/logout', component: Logout, isPublic: true },
  { path: '/manage-account', component: ManageAccount, isPublic: false },
  { path: '/select-affiliation', component: SelectAffiliation, isPublic: false },
  { path: '/state-admin', component: StateAdmin, isPublic: false },
  { component: NoMatch, isPublic: true }
];

export default routes;
