import React, { Fragment, useEffect, useState } from "react";
import { Link, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { LineBreak, withParams } from "../../../common/components/utils";
import Breadcrumbs from "dataEntryApp/components/Breadcrumbs";
import { Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import { getAllLocations, getGenders, getOrganisationConfig } from "../../reducers/metadataReducer";
import Button from "@material-ui/core/Button";
import BasicForm from "../GlobalSearch/BasicForm";
import NonCodedConceptForm from "../GlobalSearch/NonCodedConceptForm";
import NonConceptForm from "../GlobalSearch/NonConceptForm";
import CodedConceptForm from "../GlobalSearch/CodedConceptForm";
import IncludeVoidedForm from "../GlobalSearch/IncludeVoidedForm";
import CustomizedBackdrop from "../../components/CustomizedBackdrop";
import Grid from "@material-ui/core/Grid";
import moment from "moment/moment";
import { store } from "../../../common/store/createStore";
import { types } from "../../reducers/searchFilterReducer";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { locationNameRenderer } from "../../utils/LocationUtil";
import SubjectTypeOptions from "./SubjectTypeOptions";

const initialStates = {
  nameAgeSearchAll: {
    name: "",
    age: "",
    searchAll: ""
  },
  entityDate: {
    RegistrationDate: { minValue: null, maxValue: null },
    EnrolmentDate: { minValue: null, maxValue: null },
    ProgramEncounterDate: { minValue: null, maxValue: null },
    EncounterDate: { minValue: null, maxValue: null }
  }
};

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3, 2),
    margin: theme.spacing(1, 3),
    flexGrow: 1
  },
  mainHeading: {
    fontSize: "20px"
  },
  buttons: {
    "& > *": {
      margin: theme.spacing(1)
    }
  },
  formLabelRoot: {
    color: "rgba(0, 0, 0, 0.54)",
    "&$formLabelFocused": { color: "rgba(0, 0, 0, 0.54)" }
  },
  formLabelFocused: {}
}));

function SearchFilterFormContainer({
  match,
  operationalModules,
  getAllLocations,
  allLocations,
  getGenders,
  genders,
  getOrganisationConfig,
  organisationConfigs,
  searchRequest
}) {
  useEffect(() => {
    if (!organisationConfigs) {
      getOrganisationConfig();
    }
    getAllLocations();
    getGenders();
  }, []);

  if (!(operationalModules && allLocations && genders && organisationConfigs)) {
    return <CustomizedBackdrop load={false} />;
  } else {
    return (
      <SearchFilterForm
        match={match}
        operationalModules={operationalModules}
        allLocations={allLocations}
        genders={genders}
        organisationConfigs={organisationConfigs}
        searchRequest={searchRequest}
      />
    );
  }
}

const mapStateToProps = state => {
  return {
    operationalModules: state.dataEntry.metadata.operationalModules,
    allLocations: state.dataEntry.metadata.allLocations,
    genders: state.dataEntry.metadata.genders,
    organisationConfigs: state.dataEntry.metadata.organisationConfigs,
    searchRequest: state.dataEntry.searchFilterReducer.request
  };
};

const mapDispatchToProps = {
  getAllLocations,
  getGenders,
  getOrganisationConfig
};

export default withRouter(
  withParams(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(SearchFilterFormContainer)
  )
);

function SearchFilterForm({
  match,
  operationalModules,
  allLocations,
  genders,
  organisationConfigs,
  searchRequest
}) {
  const classes = useStyles();
  const { t } = useTranslation();
  return (
    <Fragment>
      <Breadcrumbs path={match.path} />
      <Paper className={classes.root}>
        <Typography component={"span"} className={classes.mainHeading}>
          {t("search")}
        </Typography>
        <LineBreak num={1} />
        <SearchForm
          operationalModules={operationalModules}
          allLocations={allLocations}
          genders={genders}
          organisationConfigs={organisationConfigs}
          searchRequest={searchRequest}
          searchTo={"/app/search"}
          cancelTo={"/app/"}
        />
      </Paper>
    </Fragment>
  );
}

export const SearchForm = ({
  operationalModules,
  allLocations,
  genders,
  organisationConfigs,
  searchRequest,
  searchTo,
  cancelTo,
  onSearch
}) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const searchProps = _.isFunction(onSearch) ? {} : { to: searchTo, component: Link };
  const {
    subjectType,
    name,
    age,
    includeVoided,
    addressIds,
    concept,
    gender,
    registrationDate,
    encounterDate,
    programEncounterDate,
    programEnrolmentDate,
    searchAll
  } = searchRequest;

  const [selectedSubjectTypeUUID, setSelectedSubjectTypeUUID] = useState(
    subjectType || _.get(operationalModules.subjectTypes[0], "uuid")
  );

  const initialSubjectTypeSearchFilter =
    organisationConfigs &&
    organisationConfigs.organisationConfig.searchFilters &&
    organisationConfigs.organisationConfig.searchFilters.filter(
      searchFilter => searchFilter.subjectTypeUUID === selectedSubjectTypeUUID
    );

  const [selectedSearchFilter, setSelectedSearchFilter] = useState(
    initialSubjectTypeSearchFilter || []
  );

  // name age search all
  const [enterValue, setEnterValue] = useState({
    name: name || "",
    age: (age && age.minValue) || "",
    searchAll: searchAll || ""
  });

  const searchFilterValue = event => {
    const value = event.target.value;
    setEnterValue({
      ...enterValue,
      [event.target.name]: value
    });
  };

  //Gender
  let g = {};
  _.forEach(gender, gender => _.assign(g, { [gender]: true }));
  const [selectedGender, setSelectedGender] = React.useState(g);
  const onGenderChange = event => {
    if (event.target.checked) {
      setSelectedGender({ ...selectedGender, [event.target.name]: event.target.checked });
    } else {
      setSelectedGender({ ...selectedGender, [event.target.name]: event.target.checked });
    }
  };

  const selectedGenderSort =
    selectedGender != null
      ? Object.keys(selectedGender)
          .filter(selectedId => selectedGender[selectedId])
          .map(String)
      : [];

  // address
  const previousSelectedLocations =
    (addressIds && allLocations.filter(({ id }) => _.includes(addressIds, id))) || [];
  const previousSelectedType = _.get(_.head(previousSelectedLocations), "type", "");
  const [selectedAddressLevelType, setSelectedAddressLevelType] = useState(previousSelectedType);
  const [selectedAddress, setSelectedAddress] = React.useState(
    previousSelectedLocations.map(location => ({
      label: location.name,
      value: location.id,
      optionLabel: locationNameRenderer(location)
    }))
  );
  const onAddressSelect = value => setSelectedAddress(value);
  const selectedAddressSort =
    selectedAddress !== null ? selectedAddress.map(address => address.value) : [];

  const setPreviousMinMaxValues = registrationDate => ({
    minValue: (registrationDate && registrationDate.minValue) || null,
    maxValue: (registrationDate && registrationDate.maxValue) || null
  });
  // date
  const [selectedDate, setSelectedDate] = useState({
    RegistrationDate: setPreviousMinMaxValues(registrationDate),
    EnrolmentDate: setPreviousMinMaxValues(programEnrolmentDate),
    ProgramEncounterDate: setPreviousMinMaxValues(programEncounterDate),
    EncounterDate: setPreviousMinMaxValues(encounterDate)
  });

  const searchFilterDates = (minDate, maxDate, type) => {
    setSelectedDate({
      ...selectedDate,
      [type]: {
        minValue: minDate !== null ? moment(minDate).format("YYYY-MM-DD") : null,
        maxValue: maxDate !== null ? moment(maxDate).format("YYYY-MM-DD") : null
      }
    });
  };

  const conceptList = selectedSearchFilter.filter(
    searchElement => searchElement.type === "Concept"
  );

  const initialConceptList = conceptList
    .filter(concept => concept.conceptDataType !== null)
    .map(concept => {
      const defaultState = {
        Date: { ...concept, minValue: null, maxValue: null },
        DateTime: { ...concept, minValue: null, maxValue: null },
        Time: { ...concept, minValue: null, maxValue: null },
        Numeric: { ...concept, minValue: null, maxValue: null },
        Coded: { ...concept, values: [] },
        Text: { ...concept, value: "" }
      };
      return defaultState[concept.conceptDataType];
    });

  const allConceptRelatedFilters = _.map(initialConceptList, item =>
    _.merge(item, _.find(concept, { uuid: item.conceptUUID }))
  );
  const [selectedConcepts, setSelectedConcept] = useState(allConceptRelatedFilters);
  const searchFilterConcept = (event, searchFilterForm, fieldName) => {
    setSelectedConcept(previousSelectedConcepts =>
      previousSelectedConcepts.map(concept => {
        if (concept.conceptDataType === null) {
        } else {
          if (["Date", "DateTime", "Time"].includes(concept.conceptDataType)) {
            if (concept.conceptUUID === searchFilterForm.conceptUUID) {
              return {
                ...concept,
                [fieldName]: event
              };
            } else {
              return {
                ...concept
              };
            }
          } else if (concept.conceptDataType === "Coded") {
            if (concept.conceptUUID === searchFilterForm.conceptUUID) {
              const selectedCodedValue = {};
              concept.values.forEach(element => {
                selectedCodedValue[element] = true;
              });
              selectedCodedValue[event.target.name] = event.target.checked;

              return {
                ...concept,
                values: Object.keys(selectedCodedValue).filter(
                  selectedId => selectedCodedValue[selectedId]
                )
              };
            } else {
              return {
                ...concept
              };
            }
          } else if (concept.conceptDataType === "Text") {
            if (concept.conceptUUID === searchFilterForm.conceptUUID) {
              const selectedText = event.target.value;
              return {
                ...concept,
                value: selectedText
              };
            } else {
              return {
                ...concept
              };
            }
          } else if (concept.conceptDataType === "Numeric") {
            if (concept.conceptUUID === searchFilterForm.conceptUUID) {
              const slectedNumeric = event.target.value;
              return {
                ...concept,
                [fieldName]: slectedNumeric
              };
            } else {
              return {
                ...concept
              };
            }
          }
        }
        return null;
      })
    );
  };
  // is voided
  const [includeVoied, setIncludeVoided] = React.useState(includeVoided || false);

  const includeVoidedChange = event => {
    setIncludeVoided(event.target.checked);
  };
  //concept
  const selectedConceptApi = selectedConcepts.filter(selectedConcept => {
    if (selectedConcept.conceptDataType === null) {
    } else {
      if (["Date", "DateTime", "Time"].includes(selectedConcept.conceptDataType)) {
        if (selectedConcept.widget === "Range") {
          return selectedConcept.minValue && selectedConcept.maxValue;
        } else {
          return selectedConcept.minValue;
        }
      } else if (selectedConcept.conceptDataType === "Coded" && selectedConcept.values.length > 0) {
        return selectedConcept.values;
      } else if (selectedConcept.conceptDataType === "Text") {
        return selectedConcept.value;
      } else if (selectedConcept.conceptDataType === "Numeric") {
        if (selectedConcept.widget === "Range") {
          return selectedConcept.minValue && selectedConcept.maxValue;
        } else {
          return selectedConcept.minValue;
        }
      }
    }
    return null;
  });

  const conceptRequests = selectedConceptApi.map(conceptRequest => {
    if (["Date", "DateTime", "Time"].includes(conceptRequest.conceptDataType)) {
      return {
        uuid: conceptRequest.conceptUUID,
        minValue:
          conceptRequest.minValue !== null
            ? moment(conceptRequest.minValue).format("YYYY-MM-DD")
            : null,
        maxValue:
          conceptRequest.maxValue !== null
            ? moment(conceptRequest.maxValue).format("YYYY-MM-DD")
            : null,
        searchScope: conceptRequest.scope,
        dataType: conceptRequest.conceptDataType,
        widget: conceptRequest.widget
      };
    } else if (conceptRequest.conceptDataType === "Coded") {
      return {
        uuid: conceptRequest.conceptUUID,
        searchScope: conceptRequest.scope,
        dataType: conceptRequest.conceptDataType,
        widget: conceptRequest.widget,
        values: conceptRequest.values
      };
    } else if (conceptRequest.conceptDataType === "Text") {
      return {
        uuid: conceptRequest.conceptUUID,
        searchScope: conceptRequest.scope,
        dataType: conceptRequest.conceptDataType,
        widget: conceptRequest.widget,
        value: conceptRequest.value
      };
    } else if (conceptRequest.conceptDataType === "Numeric") {
      return {
        uuid: conceptRequest.conceptUUID,
        minValue: conceptRequest.minValue,
        maxValue: conceptRequest.maxValue,
        searchScope: conceptRequest.scope,
        dataType: conceptRequest.conceptDataType,
        widget: conceptRequest.widget
      };
    } else {
      return null;
    }
  });

  const searchResult = () => {
    const searchRequest = {
      subjectType: selectedSubjectTypeUUID,
      name: enterValue.name,
      age: {
        minValue: enterValue.age,
        maxValue: null
      },
      includeVoided: includeVoied,
      addressIds: selectedAddressSort,
      concept: conceptRequests,
      gender: selectedGenderSort,
      registrationDate: {
        minValue: selectedDate.RegistrationDate.minValue,
        maxValue: selectedDate.RegistrationDate.maxValue
      },
      encounterDate: {
        minValue: selectedDate.EncounterDate.minValue,
        maxValue: selectedDate.EncounterDate.maxValue
      },
      programEncounterDate: {
        minValue: selectedDate.ProgramEncounterDate.minValue,
        maxValue: selectedDate.ProgramEncounterDate.maxValue
      },
      programEnrolmentDate: {
        minValue: selectedDate.EnrolmentDate.minValue,
        maxValue: selectedDate.EnrolmentDate.maxValue
      },
      searchAll: enterValue.searchAll
    };

    if (_.isFunction(onSearch)) {
      onSearch(searchRequest);
    } else {
      store.dispatch({ type: types.ADD_SEARCH_REQUEST, value: searchRequest });
    }
  };

  const resetFilters = () => {
    setEnterValue(initialStates.nameAgeSearchAll);
    setSelectedGender({});
    setSelectedAddress([]);
    setSelectedAddressLevelType("");
    setSelectedDate(initialStates.entityDate);
    setSelectedConcept(initialConceptList);
    setIncludeVoided(false);
  };

  const onSubjectTypeChange = subjectTypeUUID => {
    setSelectedSubjectTypeUUID(subjectTypeUUID);
    const selectedSubjectTypeSearchFilter =
      organisationConfigs.organisationConfig.searchFilters &&
      organisationConfigs.organisationConfig.searchFilters.filter(
        searchFilter => searchFilter.subjectTypeUUID === subjectTypeUUID
      );
    setSelectedSearchFilter(selectedSubjectTypeSearchFilter || []);
    resetFilters();
  };

  return (
    <React.Fragment>
      <FormControl component="fieldset">
        <SubjectTypeOptions
          operationalModules={operationalModules}
          onSubjectTypeChange={onSubjectTypeChange}
          selectedSubjectTypeUUID={selectedSubjectTypeUUID}
          t={t}
        />
        {selectedSearchFilter ? (
          <div>
            <Grid container>
              <Grid item xs={12}>
                <BasicForm
                  searchFilterForms={selectedSearchFilter}
                  onChange={searchFilterValue}
                  enterValue={enterValue}
                  operationalModules={operationalModules}
                  genders={genders}
                  allLocation={allLocations}
                  onGenderChange={onGenderChange}
                  selectedGender={selectedGender}
                  onAddressSelect={onAddressSelect}
                  selectedAddress={selectedAddress}
                  selectedAddressLevelType={selectedAddressLevelType}
                  setSelectedAddressLevelType={setSelectedAddressLevelType}
                />
              </Grid>
              <Grid item xs={12}>
                <NonCodedConceptForm
                  searchFilterForms={selectedSearchFilter}
                  onChange={searchFilterConcept}
                  selectedConcepts={selectedConcepts}
                />
              </Grid>
              <Grid item xs={12}>
                <NonConceptForm
                  searchFilterForms={selectedSearchFilter}
                  selectedDate={selectedDate}
                  onDateChange={searchFilterDates}
                />
              </Grid>
              <Grid item xs={12}>
                <CodedConceptForm
                  searchFilterForms={selectedSearchFilter}
                  conceptList={organisationConfigs.conceptList}
                  onChange={searchFilterConcept}
                  selectedConcepts={selectedConcepts}
                />
              </Grid>
              <Grid item xs={12}>
                <IncludeVoidedForm
                  includeVoided={includeVoied}
                  includeVoidedChange={includeVoidedChange}
                />
              </Grid>
            </Grid>
          </div>
        ) : (
          ""
        )}
        <div className={classes.buttons}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => searchResult()}
            {...searchProps}
          >
            {t("search")}
          </Button>
          {cancelTo && (
            <Button variant="contained" component={Link} to={cancelTo}>
              {t("cancel")}
            </Button>
          )}
        </div>
      </FormControl>
    </React.Fragment>
  );
};
