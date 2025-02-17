import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Collapse from "@material-ui/core/Collapse";
import SettingsIcon from "@material-ui/icons/Settings";
import LogoutIcon from "@material-ui/icons/Input";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import { LOCALES } from "../../common/constants";
import { useTranslation } from "react-i18next";
import { logout, saveUserInfo } from "rootApp/ducks";
import { connect } from "react-redux";
import { get } from "lodash";

const useStyles = makeStyles(theme => ({
  grow: {
    flexGrow: 1
  },
  menuButton: {
    marginRight: theme.spacing(2)
  },
  title: {
    flexGrow: 1,
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "block"
    }
  },
  sectionDesktop: {
    display: "none",
    [theme.breakpoints.up("md")]: {
      display: "flex"
    }
  },
  root: {
    width: "22%",
    color: "blue",
    maxWidth: 360,
    position: "absolute",
    zIndex: "100",
    backgroundColor: theme.palette.background.paper,
    marginRight: "150px"
  },
  MuiSvgIcon: {
    root: {
      color: "blue"
    }
  },
  nested: {
    paddingLeft: theme.spacing(4)
  },
  sectionMobile: {
    display: "flex",
    [theme.breakpoints.up("md")]: {
      display: "none"
    }
  },
  inputSearch: {
    borderBottom: "1px solid #dcdcdc",
    color: "#0e6eff",
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(1),
      width: "715px"
    }
  },
  headerMenu: {
    marginLeft: theme.spacing(3)
  },
  ListItemText: {
    color: "blue"
  },
  horizontalLine: {
    padding: "0px",
    marginTop: "0px",
    marginBottom: "0px",
    width: "90%"
  }
}));

const UserOption = ({ orgConfig, userInfo, defaultLanguage, saveUserInfo, logout }) => {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const toggleSettingsMenu = () => {
    setOpen(!open);
  };

  const getKeyByValue = (object, value) => {
    return Object.keys(object).find(key => object[key] === value);
  };

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (anchorRef.current && prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }

    prevOpen.current = open;
  }, [open]);

  const { t, i18n } = useTranslation();

  const handleChange = event => {
    if (event.target.value) {
      userInfo.settings = { ...userInfo.settings, locale: event.target.value };
      saveUserInfo(userInfo);
      i18n.changeLanguage(userInfo.settings.locale);
    }
  };

  return (
    <div style={{ float: "right", boxShadow: "3px 3px 5px #aaaaaa", marginRight: "300px" }}>
      <List
        component="nav"
        aria-labelledby="nested-list-subheader"
        className={classes.root}
        style={{ boxShadow: "3px 3px 5px #aaaaaa", padding: "1%" }}
      >
        <ListItem
          button
          onClick={toggleSettingsMenu}
          style={{ paddingTop: "5px", paddingBottom: "5px" }}
        >
          <ListItemIcon>
            <SettingsIcon style={{ color: "blue" }} />
          </ListItemIcon>
          <ListItemText primary={t("settings")} style={{ color: "blue" }} />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <FormControl
            component="fieldset"
            className={classes.formControl}
            style={{ fontSize: "12px", marginTop: "20px", marginLeft: "85px" }}
          >
            <FormLabel component="legend">{t("language")}</FormLabel>
            <RadioGroup
              aria-label="language"
              name="language"
              value={get(userInfo, "settings.locale", "en")}
              onChange={handleChange}
            >
              {orgConfig
                ? orgConfig.map((element, index) => (
                    <FormControlLabel
                      value={element}
                      key={index}
                      control={<Radio />}
                      label={t(
                        getKeyByValue(LOCALES, element).charAt(0) +
                          getKeyByValue(LOCALES, element)
                            .slice(1)
                            .toLowerCase()
                      )}
                    />
                  ))
                : ""}
            </RadioGroup>
          </FormControl>
        </Collapse>
        <hr className={classes.horizontalLine} />
        <ListItem onClick={logout} button style={{ paddingTop: "5px", paddingBottom: "5px" }}>
          <ListItemIcon>
            <LogoutIcon style={{ color: "blue" }} />
          </ListItemIcon>
          <ListItemText primary={t("logout")} />
        </ListItem>
      </List>
    </div>
  );
};

const mapStateToProps = state => ({
  orgConfig: state.translationsReducer.orgConfig
    ? state.translationsReducer.orgConfig._embedded.organisationConfig[0].settings.languages
    : "",
  userInfo: state.app.userInfo,
  defaultLanguage:
    state.app.userInfo.settings && state.app.userInfo.settings.locale
      ? state.app.userInfo.settings.locale
      : "en"
});

const mapDispatchToProps = dispatch => ({
  saveUserInfo: saveUserInfo,
  logout: () => dispatch(logout())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserOption);
