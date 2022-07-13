import { all, call, fork, put, select, takeLatest, takeEvery } from "redux-saga/effects";
import { find, keys } from "lodash";
import {
  types,
  setEncounterFormMappings,
  saveEncounterComplete,
  onLoadSuccess,
  setFilteredFormElements,
  setEligibleEncounters
} from "../reducers/encounterReducer";
import api from "../api";
import {
  selectFormMappingsForSubjectType,
  selectFormMappingForEncounter,
  selectFormMappingForCancelEncounter
} from "./encounterSelector";
import { mapForm } from "../../common/adapters";
import { Encounter, ModelGeneral as General, ObservationsHolder } from "avni-models";
import { setSubjectProfile } from "../reducers/subjectDashboardReducer";
import { getSubjectGeneral } from "../reducers/generalSubjectDashboardReducer";
import { mapProfile, mapEncounter } from "../../common/subjectModelMapper";
import { setLoad } from "../reducers/loadReducer";
import {
  selectDecisions,
  selectVisitSchedules
} from "dataEntryApp/reducers/serverSideRulesReducer";
import commonFormUtil from "dataEntryApp/reducers/commonFormUtil";
import { selectEncounterState, setState } from "dataEntryApp/reducers/encounterReducer";
import Wizard from "dataEntryApp/state/Wizard";
import { AbstractEncounter } from "openchs-models";

export default function*() {
  yield all(
    [
      encouterOnLoadWatcher,
      updateEncounterObsWatcher,
      saveEncounterWatcher,
      createEncounterWatcher,
      createEncounterForScheduledWatcher,
      editEncounterWatcher,
      updateCancelEncounterObsWatcher,
      createCancelEncounterWatcher,
      editCancelEncounterWatcher,
      nextWatcher,
      previousWatcher,
      encounterEligibilityWatcher
    ].map(fork)
  );
}

export function* encouterOnLoadWatcher() {
  yield takeLatest(types.ON_LOAD, encouterOnLoadWorker);
}
export function* encouterOnLoadWorker({ subjectUuid }) {
  yield put.resolve(setLoad(false));
  yield put.resolve(setFilteredFormElements());
  yield put.resolve(getSubjectGeneral(subjectUuid));
  const subjectProfileJson = yield call(api.fetchSubjectProfile, subjectUuid);
  const encounterFormMappings = yield select(
    selectFormMappingsForSubjectType(subjectProfileJson.subjectType.uuid)
  );
  yield put.resolve(setEncounterFormMappings(encounterFormMappings));
  yield put.resolve(setSubjectProfile(mapProfile(subjectProfileJson)));
  yield put.resolve(setLoad(true));
}

export function* encounterEligibilityWatcher() {
  yield takeLatest(types.GET_ELIGIBLE_ENCOUNTERS, encounterEligibilityWorker);
}

export function* encounterEligibilityWorker({ subjectUuid }) {
  yield put.resolve(setLoad(false));
  const eligibleEncounters = yield call(api.fetchEligibleEncounterTypes, subjectUuid);
  yield put.resolve(setEligibleEncounters(eligibleEncounters));
  yield put.resolve(setLoad(true));
}

export function* createEncounterWatcher() {
  yield takeLatest(types.CREATE_ENCOUNTER, createEncounterWorker);
}
export function* createEncounterWorker({ encounterTypeUuid, subjectUuid }) {
  const subjectProfileJson = yield call(api.fetchSubjectProfile, subjectUuid);
  const state = yield select();

  /*create new encounter obj */
  const encounter = new Encounter();
  encounter.uuid = General.randomUUID();
  encounter.encounterDateTime = new Date();
  encounter.observations = [];
  encounter.encounterType = find(
    state.dataEntry.metadata.operationalModules.encounterTypes,
    eT => eT.uuid === encounterTypeUuid
  );
  encounter.name = encounter.encounterType.name;

  yield setEncounterDetails(encounter, subjectProfileJson);
}

export function* createEncounterForScheduledWatcher() {
  yield takeLatest(types.CREATE_ENCOUNTER_FOR_SCHEDULED, createEncounterForScheduledWorker);
}
export function* createEncounterForScheduledWorker({ encounterUuid }) {
  const encounterJson = yield call(api.fetchEncounter, encounterUuid);
  const subjectProfileJson = yield call(api.fetchSubjectProfile, encounterJson.subjectUUID);
  const encounter = mapEncounter(encounterJson);
  encounter.encounterDateTime = new Date();
  yield setEncounterDetails(encounter, subjectProfileJson);
}

function* updateEncounterObsWatcher() {
  yield takeEvery(types.UPDATE_OBS, updateEncounterObsWorker);
}
export function* updateEncounterObsWorker({ formElement, value, childFormElement }) {
  const state = yield select(selectEncounterState);
  const encounter = state.encounter.cloneForEdit();
  const { validationResults, filteredFormElements } = commonFormUtil.updateObservations(
    formElement,
    value,
    encounter,
    new ObservationsHolder(encounter.observations),
    state.validationResults,
    childFormElement
  );
  yield put(
    setState({
      ...state,
      filteredFormElements,
      encounter,
      validationResults
    })
  );
}

export function* saveEncounterWatcher() {
  yield takeLatest(types.SAVE_ENCOUNTER, saveEncounterWorker);
}

export function* saveEncounterWorker(params) {
  const state = yield select();
  const encounter = state.dataEntry.encounterReducer.encounter;

  const visitSchedules = yield select(selectVisitSchedules);
  const decisions = yield select(selectDecisions);
  if (decisions) decisions.cancel = params.isCancel;

  let resource = encounter.toResource;
  resource.visitSchedules = visitSchedules;
  resource.decisions = decisions;

  yield call(api.saveEncounter, resource);
  yield put(saveEncounterComplete());
}

function* editEncounterWatcher() {
  yield takeLatest(types.EDIT_ENCOUNTER, editEncounterWorker);
}
export function* editEncounterWorker({ encounterUuid }) {
  const encounterJson = yield call(api.fetchEncounter, encounterUuid);
  const subjectProfileJson = yield call(api.fetchSubjectProfile, encounterJson.subjectUUID);
  yield setEncounterDetails(mapEncounter(encounterJson), subjectProfileJson);
}

export function* setEncounterDetails(encounter, subjectProfileJson) {
  const subject = mapProfile(subjectProfileJson);
  const formMapping = yield select(
    selectFormMappingForEncounter(encounter.encounterType.uuid, subjectProfileJson.subjectType.uuid)
  );
  const encounterFormJson = yield call(api.fetchForm, formMapping.formUUID);
  const encounterForm = mapForm(encounterFormJson);
  encounter.individual = subject;

  const {
    formElementGroup,
    filteredFormElements,
    onSummaryPage,
    wizard,
    isFormEmpty
  } = commonFormUtil.onLoad(encounterForm, encounter);

  yield put.resolve(
    onLoadSuccess(
      encounter,
      encounterForm,
      formElementGroup,
      filteredFormElements,
      onSummaryPage,
      wizard,
      isFormEmpty
    )
  );
  yield put.resolve(setSubjectProfile(subject));
}

function* updateCancelEncounterObsWatcher() {
  yield takeEvery(types.UPDATE_CANCEL_OBS, updateCancelEncounterObsWorker);
}
export function* updateCancelEncounterObsWorker({ formElement, value, childFormElement }) {
  const state = yield select(selectEncounterState);
  const encounter = state.encounter.cloneForEdit();
  const { validationResults, filteredFormElements } = commonFormUtil.updateObservations(
    formElement,
    value,
    encounter,
    new ObservationsHolder(encounter.cancelObservations),
    state.validationResults,
    childFormElement
  );
  yield put(
    setState({
      ...state,
      filteredFormElements,
      encounter,
      validationResults
    })
  );
}

export function* createCancelEncounterWatcher() {
  yield takeLatest(types.CREATE_CANCEL_ENCOUNTER, createCancelEncounterWorker);
}
export function* createCancelEncounterWorker({ encounterUuid }) {
  const encounterJson = yield call(api.fetchEncounter, encounterUuid);
  const subjectProfileJson = yield call(api.fetchSubjectProfile, encounterJson.subjectUUID);
  const encounter = mapEncounter(encounterJson);
  encounter.cancelDateTime = new Date();
  encounter.cancelObservations = [];
  yield setCancelEncounterDetails(encounter, subjectProfileJson);
}

export function* editCancelEncounterWatcher() {
  yield takeLatest(types.EDIT_CANCEL_ENCOUNTER, editCancelEncounterWorker);
}
export function* editCancelEncounterWorker({ encounterUuid }) {
  const encounterJson = yield call(api.fetchEncounter, encounterUuid);
  const subjectProfileJson = yield call(api.fetchSubjectProfile, encounterJson.subjectUUID);
  yield setCancelEncounterDetails(mapEncounter(encounterJson), subjectProfileJson);
}

export function* setCancelEncounterDetails(encounter, subjectProfileJson) {
  const subject = mapProfile(subjectProfileJson);
  encounter.individual = subject;

  const cancelFormMapping = yield select(
    selectFormMappingForCancelEncounter(
      encounter.encounterType.uuid,
      subjectProfileJson.subjectType.uuid
    )
  );
  const cancelEncounterFormJson = yield call(api.fetchForm, cancelFormMapping.formUUID);
  const encounterCancellationForm = mapForm(cancelEncounterFormJson);
  const {
    formElementGroup,
    filteredFormElements,
    onSummaryPage,
    wizard,
    isFormEmpty
  } = commonFormUtil.onLoad(encounterCancellationForm, encounter);

  yield put.resolve(
    onLoadSuccess(
      encounter,
      encounterCancellationForm,
      formElementGroup,
      filteredFormElements,
      onSummaryPage,
      wizard,
      isFormEmpty
    )
  );
  yield put.resolve(setSubjectProfile(subject));
}

export function* nextWatcher() {
  yield takeLatest(types.ON_NEXT, wizardWorker, commonFormUtil.onNext, true);
}

export function* previousWatcher() {
  yield takeLatest(types.ON_PREVIOUS, wizardWorker, commonFormUtil.onPrevious, false);
}

export function* wizardWorker(getNextState, isNext, params) {
  const state = yield select(selectEncounterState);

  if (state.isFormEmpty) {
    yield put(
      setState({
        ...state,
        onSummaryPage: isNext,
        wizard: isNext ? new Wizard(1, 1, 2) : new Wizard(1)
      })
    );
  } else {
    const obsToUpdate = params.isCancel ? "cancelObservations" : "observations";
    const {
      formElementGroup,
      filteredFormElements,
      validationResults,
      observations,
      onSummaryPage,
      wizard
    } = getNextState({
      formElementGroup: state.formElementGroup,
      filteredFormElements: state.filteredFormElements,
      observations: state.encounter[obsToUpdate],
      entity: state.encounter,
      validationResults: state.validationResults,
      onSummaryPage: state.onSummaryPage,
      wizard: state.wizard.clone(),
      entityValidations: params.isCancel ? [] : state.encounter.validate(),
      staticFormElementIds: state.wizard.isFirstPage() ? keys(AbstractEncounter.fieldKeys) : []
    });

    const encounter = state.encounter.cloneForEdit();
    encounter[obsToUpdate] = observations;
    const nextState = {
      ...state,
      encounter,
      formElementGroup,
      filteredFormElements,
      validationResults,
      onSummaryPage,
      wizard
    };
    yield put(setState(nextState));
  }
}
