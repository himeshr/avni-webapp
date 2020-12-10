import { connect } from "react-redux";
import FormWizard from "dataEntryApp/views/registration/FormWizard";
import { ObservationsHolder } from "avni-models";
import {
  updateObs,
  saveProgramEnrolment,
  setValidationResults,
  selectProgramEnrolmentState,
  onNext,
  onPrevious
} from "dataEntryApp/reducers/programEnrolReducer";
import { withRouter } from "react-router-dom";

const mapFormStateToProps = state => {
  const enrolmentState = selectProgramEnrolmentState(state);
  return {
    form: enrolmentState.enrolForm,
    subject: state.dataEntry.subjectProfile.subjectProfile,
    observations: enrolmentState.programEnrolment.observations,
    obsHolder: new ObservationsHolder(enrolmentState.programEnrolment.observations),
    title: `New Enrolment`,
    saved: enrolmentState.saved,
    onSaveGoto: "/app/subject?uuid=" + state.dataEntry.subjectProfile.subjectProfile.uuid,
    validationResults: enrolmentState.validationResults,
    message: `${enrolmentState.programEnrolment.program.name} Enrolment Saved`,
    filteredFormElements: enrolmentState.filteredFormElements,
    entity: enrolmentState.programEnrolment,
    formElementGroup: enrolmentState.formElementGroup,
    onSummaryPage: enrolmentState.onSummaryPage
  };
};

const mapFormDispatchToProps = {
  updateObs,
  onSave: () => saveProgramEnrolment(false),
  setValidationResults,
  onNext,
  onPrevious
};

const ProgramEnrolmentForm = withRouter(
  connect(
    mapFormStateToProps,
    mapFormDispatchToProps
  )(FormWizard)
);

export default ProgramEnrolmentForm;
