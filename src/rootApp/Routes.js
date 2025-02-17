import React from "react";
import { includes, intersection, isEmpty } from "lodash";
import { Redirect, Route, Switch } from "react-router-dom";
import { connect } from "react-redux";
import { AccessDenied, WithProps } from "../common/components/utils";
import { OrgManager } from "../adminApp";
import { ROLES } from "../common/constants";
import "./SecureApp.css";
import DataEntry from "../dataEntryApp/DataEntry";
import Homepage from "./views/Homepage";
import Translations from "../translations";
import Export from "../reports/Export";
import OrgManagerAppDesigner from "../adminApp/OrgManagerAppDesigner";
import Tutorials from "../tutorials/Tutorials";
import SelfServiceReports from "../reports/SelfServiceReports";
import CannedReport from "../reports/cannedReport/CannedReport";
import News from "../news/News";
import Documentation from "../documentation/Documentation";

const RestrictedRoute = ({ component: C, allowedRoles, currentUserRoles, ...rest }) => (
  <Route
    {...rest}
    render={routerProps =>
      isEmpty(allowedRoles) || !isEmpty(intersection(allowedRoles, currentUserRoles)) ? (
        <C {...routerProps} />
      ) : (
        <AccessDenied />
      )
    }
  />
);

const Routes = ({ user, organisation }) => (
  <Switch>
    <Route path="/admin">
      <RestrictedRoute
        path="/"
        allowedRoles={[ROLES.ORG_ADMIN, ROLES.ADMIN]}
        currentUserRoles={user.roles}
        component={OrgManager}
      />
    </Route>
    <RestrictedRoute
      path="/app"
      allowedRoles={[ROLES.USER, ROLES.ORG_ADMIN]}
      currentUserRoles={user.roles}
      component={DataEntry}
    />
    <Route exact path="/">
      <Redirect
        to={
          includes(user.roles, ROLES.ADMIN)
            ? "/admin"
            : includes(user.roles, ROLES.ORG_ADMIN)
            ? "/home"
            : "/app"
        }
      />
    </Route>
    <RestrictedRoute
      exact
      path="/home"
      allowedRoles={[ROLES.ORG_ADMIN, ROLES.ADMIN]}
      currentUserRoles={user.roles}
      component={WithProps({ user }, Homepage)}
    />
    <Route path="/appdesigner">
      <RestrictedRoute
        path="/"
        allowedRoles={[ROLES.ORG_ADMIN]}
        currentUserRoles={user.roles}
        component={WithProps({ user, organisation }, OrgManagerAppDesigner)}
      />
    </Route>
    <RestrictedRoute
      exact
      path="/documentation"
      allowedRoles={[ROLES.ORG_ADMIN, ROLES.ADMIN]}
      currentUserRoles={user.roles}
      component={WithProps({ user, organisation }, Documentation)}
    />
    <RestrictedRoute
      exact
      path="/translations"
      allowedRoles={[ROLES.ORG_ADMIN, ROLES.ADMIN]}
      currentUserRoles={user.roles}
      component={WithProps({ user, organisation }, Translations)}
    />
    <RestrictedRoute
      exact
      path="/export"
      allowedRoles={[ROLES.ORG_ADMIN, ROLES.ADMIN]}
      currentUserRoles={user.roles}
      component={WithProps({ user, organisation }, Export)}
    />
    <RestrictedRoute
      exact
      path="/selfservicereports"
      allowedRoles={[ROLES.ORG_ADMIN, ROLES.ADMIN]}
      currentUserRoles={user.roles}
      component={WithProps({ user, organisation }, SelfServiceReports)}
    />
    <RestrictedRoute
      exact
      path="/cannedreports"
      allowedRoles={[ROLES.ORG_ADMIN, ROLES.ADMIN]}
      currentUserRoles={user.roles}
      component={WithProps({ user, organisation }, CannedReport)}
    />
    <RestrictedRoute
      exact
      path="/help"
      allowedRoles={[ROLES.ORG_ADMIN, ROLES.ADMIN]}
      currentUserRoles={user.roles}
      component={WithProps({ user, organisation }, Tutorials)}
    />
    <RestrictedRoute
      path="/news"
      allowedRoles={[ROLES.ORG_ADMIN, ROLES.ADMIN]}
      currentUserRoles={user.roles}
      component={WithProps({ user, organisation }, News)}
    />
    news
    <Route
      component={() => (
        <div>
          <span>Page Not found</span>
        </div>
      )}
    />
  </Switch>
);

const mapStateToProps = state => ({
  organisation: state.app.organisation,
  user: state.app.user
});

export default connect(
  mapStateToProps,
  null
)(Routes);
