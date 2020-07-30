import React, { Fragment } from "react";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Grid from "@material-ui/core/Grid";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
const useStyles = makeStyles(theme => ({
  componentSpacing: {
    marginTop: "1%",
    marginBottom: "1%"
  }
}));
function IncludeVoiedForm({ includeVoied, includeVoiedChange }) {
  const classes = useStyles();
  const { t } = useTranslation();
  return (
    <Fragment>
      <Grid container spacing={3} className={classes.componentSpacing}>
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormControlLabel
              control={
                <Checkbox checked={includeVoied} onChange={includeVoiedChange} color="primary" />
              }
              label="Include Voided"
              labelPlacement="end"
            />
          </FormControl>
        </Grid>
      </Grid>
    </Fragment>
  );
}

export default IncludeVoiedForm;
