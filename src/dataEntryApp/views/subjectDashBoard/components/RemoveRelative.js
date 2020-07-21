import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { first } from "lodash";
import { withRouter, useHistory } from "react-router-dom";
import Modal from "./CommonModal";
import DialogContent from "@material-ui/core/DialogContent";
import { FormControl, FormGroup, TextField, Typography } from "@material-ui/core";
import { noop, isNil, isEmpty } from "lodash";
import { removeRelationShip } from "../../../reducers/relationshipReducer";

const useStyles = makeStyles(theme => ({
  removeButtonStyle: {
    height: "28px",
    zIndex: 1,
    marginTop: "1px",
    boxShadow: "none",
    color: "#0e6eff",
    backgroundColor: "#fff",
    "&:hover": {
      color: "#0e6eff",
      backgroundColor: "#fff"
    }
  },
  btnCustom: {
    float: "left",
    backgroundColor: "#f27510",
    height: "30px",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "#f27510"
    }
  },
  cancelBtnCustom: {
    float: "left",
    backgroundColor: "#F8F9F9",
    color: "#fc9153",
    border: "1px solid #fc9153",
    height: "30px",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "#F8F9F9"
    }
  }
}));

const RemoveRelative = props => {
  const { t } = useTranslation();
  const classes = useStyles();

  const close = () => {};

  const removeClick = () => {
    props.removeRelationShip(props.relationId);
  };

  const searchContent = (
    <DialogContent style={{ width: 600, height: "auto" }}>
      <Grid container direction="row" justify="flex-end" alignItems="flex-start">
        <Typography variant="subtitle1" gutterBottom>
          Do you want to remove the relationship between {props.relationAname} and{" "}
          {props.relationBname}?
        </Typography>
      </Grid>
    </DialogContent>
  );

  return (
    <Modal
      content={searchContent}
      handleError={noop}
      buttonsSet={[
        {
          buttonType: "openButton",
          label: "Remove",
          classes: classes.removeButtonStyle
        },
        {
          buttonType: "applyButton",
          label: "Remove",
          redirectTo: `/app/subject?uuid=${props.mainuuid}`,
          classes: classes.btnCustom,
          click: removeClick
        },
        {
          buttonType: "cancelButton",
          label: t("cancel"),
          classes: classes.cancelBtnCustom
        }
      ]}
      title="Remove Relative"
      btnHandleClose={close}
    />
  );
};

const mapStateToProps = state => ({
  Relations: state.dataEntry.relations,
  subjects: state.dataEntry.search.subjects,
  searchParams: state.dataEntry.search.subjectSearchParams,
  subjectTypes: first(state.dataEntry.metadata.operationalModules.subjectTypes)
});

const mapDispatchToProps = {
  removeRelationShip
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(RemoveRelative)
);
