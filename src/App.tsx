import './App.css';

import Trigger from '@rc-component/trigger';
import copy from 'copy-to-clipboard';
import { useSetAtom } from "jotai"
import { Fragment, useEffect } from 'react';
import {Toaster, toast} from "react-hot-toast";
import Modal from "react-modal"

import { DialogComponent, useModal } from "./components/Dialog"
import * as icons from "./components/Icons"
import { Menu } from "./components/Menu"
import { PromptBuilder } from "./components/PromptBuilder"
import { TemplateBuilder, setModalOpenAtom, compilePrompt } from "./components/TemplateBuilder"
import * as events from "./events";
import * as state from "./state";
import * as subs from "./subs"
import { WorkspaceMenuOptions, openFileHandleAtom, onWorkspaceMenuItemClick} from "./Workspace"


function PipeSeparator() {
  return <Fragment>{" | "}</Fragment>;
}


/***
 * Manage Templates
 */

function DeleteTemplateModalBody () {
  return (
    <div>
      <strong>
        <div style={{color: "#777777"}}>Er du sikker på, at du vil slette denne skabelon?</div>
        <div style={{color: "#333333"}}>{subs.useSelectedTemplateName()}</div>
      </strong>
    </div>
  );
}

function TemplateList() {
  let selectedTemplateName = subs.useSelectedTemplateName()
  let templateIndex = subs.useTemplateIndex();
  let templateOpts = subs.useTemplateOptions();

  let setTemplateIndex = useSetAtom(events.selectTemplateAtom);

  return (
    <Trigger  maskClosable={false}
              popup={<Menu value = {templateIndex} options = {templateOpts} onMouseDown = {(k) => {setTemplateIndex(k)}} />}
              popupAlign={{points: ["tl", "bl"], offset: [0, 5]}}>
      <a>
        {selectedTemplateName} 
        <span style={{fontSize: 14}}> <icons.CaretDown/> </span>
      </a>
    </Trigger>
  );
}

function TemplateDelete() {
  let setModal = useSetAtom(useModal());
  let templateId = subs.useSelectedTemplateId();
  let deleteTemplate = useSetAtom(events.deleteTemplateAtom);  

  const deleteModal = () => {
    setModal({title: "Delete Template",
              body: <DeleteTemplateModalBody />,
              footerButtons: [["Slet", { className: "primary", onClick: () => deleteTemplate(templateId)}],
                              ["Fortryd", {}]]})
  }

  return (
    <Fragment> 
      <PipeSeparator />
      <a className="red" onClick={deleteModal}> <icons.DeleteRedIcon/> Slet </a> 
    </Fragment>
  );
}

function TemplateSelector() {
  let setModalOpen = useSetAtom(setModalOpenAtom);
  
  let templateCount = subs.useTemplates().length;
  let templateId = subs.useSelectedTemplateId();
  
  
  return (
    <Fragment>
      <TemplateList />
      <span style={{fontSize: 12, marginLeft: 3}}>
        [
        <a onClick={() => setModalOpen(templateId)}> <icons.EditIcon/> Rediger </a>
        {templateCount > 1 ? <TemplateDelete/> : null}
        ]
      </span>
    </Fragment>
  );
}


/***
 * Manage Examples
 */

function ExampleNameModalBody() {
  let exampleName = state.useNewExampleName();
  let setValue = state.useSetNewExampleName();
  return (
    <div>
      <div><strong>Indtast et navn til eksemplet:</strong></div>
      <div style={{userSelect: "none"}}>
        <input type = "text" style={{width: "100%"}} value={exampleName} onChange={ (e) => setValue(e.target.value)}/>
      </div>
    </div>
  );
}

function ExamplesList() {
  let loadExample = useSetAtom(events.loadExampleAtom);
  let exampleId = subs.useLoadedExampleId() || undefined;
  let examples = subs.useSelectedTemplateExampes();
  let exampleOptions = examples.map( (e: any) => {return {key: e.id, label: e.name }} )

  return (
    <Trigger  popup = {<Menu value = {exampleId} options={exampleOptions} onMouseDown = { loadExample }/>}
              popupAlign = {{points: ["tl", "bl"], offset: [0, 5]}}>
      <a>
        <icons.FileTextIcon /> {" Eksempler (" + examples.length + ")"} <icons.CaretDown />
      </a>
    </Trigger>
  );
}

function SetAsExample() {
  let setModal = useSetAtom(useModal());
  let createExample = useSetAtom(events.createExampleAtom);

  const createExampleModal = () => {
    setModal({ title: "Opret eksempel",
               body: <ExampleNameModalBody/>,
               footerButtons: [["Opret", { className: "primary", onClick: () => createExample()}],
                               ["Fortryd", {}]]}) 
  }
  
  return (
    <Fragment>
      <a onClick = { createExampleModal }>
        <icons.Plus/> {" Gem som eksempel"}
      </a>
      <PipeSeparator/>
    </Fragment> 
  );  
}

function UpdateExample() {
  let loadedExampleId = subs.useLoadedExampleId();
  let isExampleModified = subs.useIsExampleModified();
  let updateExample = useSetAtom(events.updateExampleAtom);

  return (
    isExampleModified ?
      <Fragment>
        <a onClick={ () => updateExample(loadedExampleId) }><icons.EditIcon/> {" Opdater eksempel"}</a>
        <PipeSeparator/>
      </Fragment>
      : null
  );  
}

function ClearExample() {
  let loadExample = useSetAtom(events.loadExampleAtom);
  return (
    <a onClick = {() => loadExample(null)}><icons.CloseCircleIcon /> {" Nulstil"}</a> 
  );  
}

function DeleteExampleModalBody() {
  let exampleName = subs.useLoadedExampleName();
  return (
    <div>
      <strong>
        <div style={{color: "#777777"}}>Er du sikker på, at du vil slette det følgende eksempel?</div>
        <div style={{color: "#333333"}}>{exampleName}</div>
      </strong>
    </div>
  );
}

function DeleteExample() {
  let loadedExampleId = subs.useLoadedExampleId();
  let deleteExample = useSetAtom(events.deleteExampleAtom);
  let setModal = useSetAtom(useModal());

  let deleteExampleModal = () => {
    setModal({title: "Slet eksempel",
              body: <DeleteExampleModalBody/>,
              footerButtons: [["Slet", { className: "primary", onClick: deleteExample}],
                              ["Fortryd", {}]]})  
  }
  
  return (
    loadedExampleId ? 
      <Fragment>
        <PipeSeparator/>
        <a className="red" onClick = {deleteExampleModal}>
          <icons.DeleteRedIcon /> {" Slet eksempel"}
        </a> 
      </Fragment>
      : null
    
  );  
}

function BuildPromptMenu() {
  let loadedExampleId = subs.useLoadedExampleId();
  let valuesEmpty = subs.useCurrentValuesEmpty();
  
  return (
    <span style={{fontSize: 12}}>
      {" [ "}
      <ExamplesList /> 
      <PipeSeparator/>
      { !valuesEmpty ?
          !loadedExampleId ? <SetAsExample/> : <UpdateExample/>
          : null
      }
      <ClearExample />
      <DeleteExample />
      {" ] "}
    </span>
  );
}


/***
 * Complete Prompt
 */

function copyToClipboard(currentPrompt: string) {
  copy(currentPrompt);
  toast.success("Prompt er kopieret til udklipsholder");
}

function CurrentPromptMenu() {
  let template = subs.useSelectedTemplate().template;
  let currentValues = subs.useCurrentValues();
  let currentPrompt = compilePrompt(template, currentValues);

  return (
    <span style={{fontSize: 12}}>
      [ <a onClick={() => {copyToClipboard(currentPrompt)}}> <icons.CopyIcon /> Kopier til udklipsholder</a> ]
    </span>
  );
}

function CompletePrompt() {
  let template = subs.useSelectedTemplate().template;
  let currentValues = subs.useCurrentValues();
  let currentPrompt = compilePrompt(template, currentValues);
  
  return (
    <pre className="ready-prompt">
      { currentPrompt ? currentPrompt : "[Tom prompt, brug værktøjet til at oprette en prompt]" }
    </pre>
  );
}


/***
 * Application components
 */

function Header() {
  let setModal = useSetAtom(useModal());
  let setModalOpen = useSetAtom(setModalOpenAtom);
  let setFileHandle = useSetAtom(openFileHandleAtom);
  let loadWorkspace = useSetAtom(events.loadWorkspaceAtom); 
  let saveWorkspace = useSetAtom(events.saveWorkspaceAtom);
  let resetWorkspace = useSetAtom(events.resetWorkspaceAtom);

  const initResetWorkspace = () => {
    setModal({
      title: "Nulstil værktøjet",
      body: <div>Efter nulstillingen vil alle ikke-gemte ændringer gå tabt. <br/> Er du sikker på, at du vil nulstille?</div>,
      footerButtons: [["Nulstil", { className: "primary", onClick: resetWorkspace}],
                      ["Fortryd", {}]]
    });
  }

  const handleWorkspaceMenuActions = 
        (key: any, label: any) => onWorkspaceMenuItemClick( key, label, loadWorkspace, saveWorkspace, setFileHandle, initResetWorkspace )

  return (
    <div className='header'>
      <div className='container flex'>
        <div className='header-left'>
          <h1>Skriv effektive prompts til alle sprogmodeller</h1>
          <div className="title-caption">Virker på tværs af ChatGPT, Gemini, Claude, Copilot, mv.</div>          
        </div>
        <div className='header-right'>
          <a className="create-template button" onClick={() => setModalOpen(true)}> <icons.FolderPlusIcon/> Opret skabelon</a>
          <Trigger action = {["click"]} 
                   maskClosable={false} 
                   popupAlign = {{points: ['tr', 'br'],  offset: [0, 5]}}
                   popup = {<Menu options={WorkspaceMenuOptions()} onMouseDown={ handleWorkspaceMenuActions }/>}>
            <a className="button" style={{marginLeft: 10}}><icons.Menu/></a>
          </Trigger>  
        </div> 
      </div>
    </div>
  );
}

Modal.setAppElement('#root');  // Required by react-modal

function App() {
  let template = subs.useSelectedTemplate();
  let setTemplate = useSetAtom(events.setTemplateAtom);
  let readState = useSetAtom(events.readStateLocalStorageAtom);

  useEffect(() => {
    readState();
  }, []);

  return (
    <div className="App">
      <Header/>
      <div className="container">
        <h2>Vælg skabelon: <TemplateSelector/></h2>
        <h2>Byg en prompt: <BuildPromptMenu/></h2>
        <PromptBuilder promptTemplate={template}/>
        <h2>Prompt: <CurrentPromptMenu /></h2>
        <CompletePrompt />
      </div>
      <TemplateBuilder onSubmit = { setTemplate }/>
      <DialogComponent />
      <div className="container">
        <h2>Dette værktøj er bygget af bulgarske <a href="https://github.com/mitenmit/gpt">Dimitar Dimitrov</a>, men oversat til dansk af <a href="http://jacob.boetter.dk">Jacob Bøtter</a>.</h2>
      </div>
      <Toaster position="bottom-center"/>
    </div>
  );
}

export default App;