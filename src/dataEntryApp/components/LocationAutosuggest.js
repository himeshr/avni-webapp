import React from "react";
import Autosuggest from "react-autosuggest";
import http from "common/utils/httpClient";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { useTranslation } from "react-i18next";
import SubjectValidation from "../views/registration/SubjectValidation";

const useStyles = makeStyles(theme => ({
  rautosuggestinput: {
    width: "23%",
    height: "30px",
    padding: "20px 20px",
    "font-family": " Helvetica, sans-serif",
    "font-weight": 300,
    "font-size": 16,
    border: "0px solid #aaa",
    borderBottom: "1px solid lightgray",
    "border-radius": "4px"
  },
  errmsg: {
    color: "red"
  }
}));

const LocationAutosuggest = ({ onSelect, selectedVillage, data }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  if (data.saved === true) {
    selectedVillage = "";
  } else if (data.saved === false && selectedVillage === undefined) {
    selectedVillage = "";
  } else {
    selectedVillage = selectedVillage;
  }

  const [value, setValue] = React.useState(selectedVillage);
  const [suggestions, setSuggestions] = React.useState([]);
  const [firstnameerrormsg, setFirstnamemsg] = React.useState("");

  const getSuggestionValue = suggestion => suggestion.title;

  const renderSuggestion = suggestion => <div>{suggestion.title}</div>;

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const onSuggestionsFetchRequested = async ({ value }) => {
    const suggestions = await getSuggestions(value);
    setSuggestions(suggestions);
  };

  const onChange = (event, { newValue }) => {
    setValue(newValue);
    const validationMsg = SubjectValidation.stringvalidation("firstName", newValue);
    // console.log("messageKey---->", validationMsg.messageKey);
    let firstnameerrormsg = validationMsg.messageKey
    console.log("messageKey---->", firstnameerrormsg);
    setFirstnamemsg(firstnameerrormsg);
   
  };

  const onSuggestionSelected = (event, { suggestion }) => onSelect(suggestion);

  const getSuggestions = async value => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0
      ? []
      : await http
          .get(`locations/search/find?title=${inputValue}`)
          .then(res => res.data._embedded.locations);
  };

  const inputProps = {
    className: classes.rautosuggestinput,
    placeholder: `${t("Village")}` + " " + `${t("name")}`,
    value,
    onChange
  };

  return (
    <div>
       <Autosuggest
      suggestions={suggestions}
      onSuggestionsFetchRequested={onSuggestionsFetchRequested}
      onSuggestionsClearRequested={onSuggestionsClearRequested}
      getSuggestionValue={getSuggestionValue}
      renderSuggestion={renderSuggestion}
      inputProps={inputProps}
      onSuggestionSelected={onSuggestionSelected}
    />
    {firstnameerrormsg && <Typography className={classes.errmsg} variant="caption" display="block" gutterBottom> {firstnameerrormsg} </Typography>}

    </div>
   
  );
};

export default LocationAutosuggest;
