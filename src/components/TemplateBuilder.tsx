import Modal from "react-modal"
import { CaretDown, ClearIcon, SourceCodeIcon, SettignsIcon, QuestionCircleIcon, Holder, Plus, DeleteRedIcon } from "../components/Icons"
import { List } from "../components/List"
import { PromptBuilder } from "../components/PromptBuilder"
import { PromptVariableAttribute, isPv, recordToPvAttr } from "../promptVariable"
import { lex } from "../lexer"
import * as state from "../state";
import * as subs from "../subs";

import ReactGrid, { Layout } from "react-grid-layout"
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai"
import { Fragment, useState } from "react"
import Trigger from '@rc-component/trigger';


type VariableAttributes = Record<string, any>;

const templateSrc = "[Mit første afsnit \n][Afsnit med variabel $varibel ][og endnu et afsnit med $enandenvariabel <br>][eksempler: $eksempler]";

const activeTabAtom = atom( 0 );
const templateNameAtom = atom( "My Template" );
const templateIdAtom = atom( null );
const templateSourceAtom = atom( templateSrc );
const variableAttributesAtom = atom<VariableAttributes>({});

const selectedVariableAtom = atom<string | null>( null );
const insertedOptionAtom = atom( "" );



const setVariableAttributeAtom = atom(
    null,
    (get, set, attr: string, val: any) => {            
        set(variableAttributesAtom, (prev) => {
            let selectedVar = get(selectedVariableAtom);    
            if (selectedVar)
                return {...prev, [selectedVar]: {...prev[selectedVar], [attr]: val}}
            else 
                return prev;
                
        });
    }    
);

const selectedVariableAttributesAtom = atom(
    (get) => {
        let selectedVar = get(selectedVariableAtom);    
        let variableAttributes = get(variableAttributesAtom);
        return variableAttributes && selectedVar && variableAttributes[selectedVar] ? variableAttributes[selectedVar] : {}
    }
);

const deleteVariableOptionAtom = atom(
    null,
    (get, set, val: any) => {            
        set(variableAttributesAtom, (prev) => {
            let selectedVar = get(selectedVariableAtom);    
            if (selectedVar) {
                let newOptions = prev[selectedVar].options.filter( (v: any) => v !== val );
                return {...prev, [selectedVar]: {...prev[selectedVar], options: newOptions}}
            } else 
                return prev;
                
        });
    }    
);

const modalOpenAtom = atom(false);
export const setModalOpenAtom = atom(
    null,
    (get, set, val: any) => {       
        if (val === true || val === false) {
            set(templateNameAtom, "My Template");
            set(templateIdAtom, null);
            set(templateSourceAtom, templateSrc)
            set(modalOpenAtom, val);
        } else if (val) {
            let template = set(state.templateByIdAtom, val);
            
            set(activeTabAtom, 0)
            set(templateNameAtom, template.name);
            set(templateIdAtom, template.id);
            set(templateSourceAtom, template.sourceTemplate)
            set(variableAttributesAtom, template.promptVariableAttributes);
            set(selectedVariableAtom, null)
            set(modalOpenAtom, true)
        }
    }    
);

function extractVariables(template: Array<any>): any {
    return template.reduce(
            (acc: Array<any>, block: any) => {
                let pVar = block?.filter( isPv )[0];
                if (pVar) acc.push(pVar.variable);
                return acc;
            }, 
            []);
}

const hydrateVariableAttributes = (template: Array<any>, variableAttributes: Record<string, any>): Record<string, PromptVariableAttribute> => {
    let variables = extractVariables(template);
    
    return ( 
        variables.reduce( (acc: Record<string, any>, v: string) => {
            acc[ v ] = recordToPvAttr( variableAttributes[ v ]);
            return acc;
        }, {})
    );
}

const getTemplateAtom = atom(
    (get) => {
        let sourceTemplate = get(templateSourceAtom);
        let template = lex(sourceTemplate);
        let variableAttributes = get(variableAttributesAtom);

        return {name: get(templateNameAtom),
                id: get(templateIdAtom),
                promptVariableAttributes: hydrateVariableAttributes(template, variableAttributes),
                sourceTemplate: sourceTemplate,
                template: template,
                examples: []}
    }
);


function Header() {
    let [activeTab, setActiveTab] = useAtom(activeTabAtom);
    let [templateName, setTemlateName] = useAtom(templateNameAtom);
    let setModalOpen = useSetAtom(setModalOpenAtom);
    let clearIconStyle: any = {color: "#777777", float: "right", padding: 5};
    
    return (
        <div className="modal-header">
            <h3>
                Opret skabelon
                <a style={clearIconStyle} onClick={() => setModalOpen(false)}> <ClearIcon /></a>
            </h3>
            <div className="title">Navn på skabelon:</div>
            <input tabIndex={1} value={templateName} style={{width: "100%"}} onChange={e => setTemlateName(e.target.value)}/>

            <div style={{lineHeight: "50px"}}>
                <ul className="tabs">
                    <li className="tab-item">
                        <button tabIndex={1} className={ activeTab === 0 ? "selected" : ""} onClick={ (e) => {e.currentTarget.blur(); setActiveTab(0); }}><SourceCodeIcon/> Skabelon</button>
                    </li>
                    <li className="tab-item">
                        <button tabIndex={1} className={activeTab === 1 ? "selected" : ""} onClick={ (e) => {e.currentTarget.blur(); setActiveTab(1)}}><SettignsIcon/> Variabler</button>
                    </li>
                </ul>
            </div>
        </div>
    );
}

function compileBlock(block: any, values: Record<string, string | null> | null): string | null{
    let filteredVars = block.filter(isPv); 
    let variable = (filteredVars && filteredVars.length) ? filteredVars[0].variable : null;
    let currentValue = values && values[variable];
  
    if (currentValue || !variable) {
      return block.reduce( (acc: string, blockElement: any) => {
        switch (true) {
          case (blockElement === "<br/>"):
            return acc;
          case isPv(blockElement): {
            let variable = blockElement.variable;
            let value = values && values[variable] ? values[variable] : currentValue;
            return acc + value;
          }
          default: 
            return acc + blockElement
        }
        
      }, "");
    } else {
      return null;
    }  
}
  
export function compilePrompt(template: any, values: Record<string, string | null> | null): string {
    return (
        template.reduce((acc: Array<any>, block: Array<any>) => {
            let compiledBlock = compileBlock(block, values);

            if (compiledBlock) {
                acc.push(compiledBlock);
                return acc;
            } else return acc;

        }, []).join("")
    )
}

function BodySource() {
    let [templateSource, setTemplateSource] = useAtom(templateSourceAtom);
    let template = lex(templateSource);
    let currentValues = subs.useCurrentValues();
    let currentPrompt = compilePrompt(template, currentValues);

    return (
        <Fragment>
            <div className="title">Opbygning af skabelon:</div>
            <textarea style={{width: "100%"}} rows={7} value={templateSource} onChange={ e => { setTemplateSource(e.target.value)}}></textarea>
            <div style={{fontSize: 11}}>
                <div style={{display: "inline-block", marginRight: 5, verticalAlign: "middle"}}><QuestionCircleIcon/></div>
                <span><strong> [...]</strong>  - afsnit (alt bør være i et afsnit); </span>
                <span><strong> $varibelnavn</strong>  - definer en variabel (en variabel per afsnit); </span>
                <span><strong> {"<br>"}</strong> - ny linje i værktøjet, men ikke i prompten; </span>
                <span><strong> new line</strong>  - ny linje i værktøj og prompt; </span>
            </div>
            <div className="title">Eksempel på prompt værktøj:</div>
            <PromptBuilder  promptTemplate={{templateSource: templateSource,
                                            template: template}}
                            style={{fontSize: 14}}/>
            <div className="title">Eksempel på prompt:</div>
            <pre className="ready-prompt">
                { currentPrompt }
            </pre>
        </Fragment>
    );
}

/*
    Body Settings
*/

function componentLabel(component: any) {
    switch(true) {
        case (component === null || component === undefined || component === "text"): return "Tekst"
        case (component === "menu"): return "Menu"
    } 
}

function VariableComponentType () {
    let setVariableAttribute = useSetAtom(setVariableAttributeAtom);
    let variableAttributes = useAtomValue(selectedVariableAttributesAtom);

    return (
        <Fragment>
            <div className="title">Type:</div>
            <Trigger action = {["click"]}
                     maskClosable = {false}
                     popup = {<List items = {[{key: "text", label: "Tekst"}, {key: "menu", label: "Menu"}]}
                                    onClick = { (k) => {setVariableAttribute("component", k)}}/>}
                     stretch = "minWidth"
                     popupStyle = {{width: "20%"}}
                     popupAlign = {{points: ["tl", "bl"],
                                    offset: [0, 0]}}>
                <div style = {{border: "1px solid #DFDFDF", borderRadius: 7, padding: 7, userSelect: "none", fontWeight: "500"}}>
                    <span>{componentLabel( recordToPvAttr(variableAttributes).getComponent() )}</span>
                    <span style={{float: "right", color: "#777777"}}><CaretDown/></span>
                </div>
            </Trigger>
        </Fragment>
    );
}

type VariableAttributeComponentProps = {
    title: string;
    attribute: string;
}

function VariableAttributeComponent(props: VariableAttributeComponentProps) {
    let setVariableAttribute = useSetAtom(setVariableAttributeAtom);
    let variableAttributes = useAtomValue(selectedVariableAttributesAtom);
    return (
        <div style = {{userSelect: "none"}}>
            <div className="title">{ props.title }</div>
            <input  type="text" 
                    style = {{width: "100%"}}
                    value = { variableAttributes && variableAttributes[props.attribute] ? variableAttributes[props.attribute] : "" }
                    onChange = { (e) => {setVariableAttribute(props.attribute, e.target.value)} }/>
        </div>
        
    );
}

function SelectedVariableAttributes() {
    let variableAttributes = useAtomValue(selectedVariableAttributesAtom);
    return (
        <Fragment>
            <VariableComponentType />
            <VariableAttributeComponent title="Placeholder:" attribute="placeholder"/>
            <VariableAttributeComponent title="Værdi, hvis tom:" attribute="emptyValue"/>

            { recordToPvAttr(variableAttributes).getComponent() === "menu" ? 
              <VariableAttributeComponent title="Titel:" attribute="title"/> : null}
        </Fragment>
    );
}

function SelectedVariableAttributesContainer() {
    let selectedVariable = useAtomValue(selectedVariableAtom);
    return selectedVariable ? 
            <SelectedVariableAttributes/> : 
            <div>Select a variable</div>; 
}

class InsertOption {toString() {return "&&insertOption&&"}}
const insertOption = new InsertOption();
const isInsertOption = (v: any) => (v instanceof InsertOption || (v.toString instanceof Function && v.toString() === "&&insertOption&&")); 

type MenuOptionProps = {
    value?: string;
    options: Array<string>;
}

function EditInsertedOption(props: MenuOptionProps) {
    let setVariableAttribute = useSetAtom(setVariableAttributeAtom);
    let [insertedOption, setInsertedOption] = useAtom(insertedOptionAtom);
    let existingOptions = new Set(props.options);
    let isOptionUnique = !existingOptions.has(insertedOption);
    // let variableAttributes = useAtomValue(selectedVariableAttributesAtom);
    // let options = variableAttributes["options"] || [];
    
    return (
        <Fragment>
            <div style={{display: "inline-block", verticalAlign: "middle", color: "#1890ff"}}><Plus/></div>
            <input type = "text" 
                   style = {{border: "0px", outline: "none", color: !isOptionUnique ? "red" : ""}} 
                   placeholder = {"Indsæt valgmulighed (↵ Enter)"}
                   value = { insertedOption }
                   onChange = { (e) => { setInsertedOption( e.target.value ) } }
                   onKeyDown={ (e) => {
                        if (e.key === "Enter") {
                            if (e.preventDefault instanceof Function) e.preventDefault();
                            if (isOptionUnique) {
                                setVariableAttribute("options", [...props.options, insertedOption]);
                                setInsertedOption( "" )
                            }    
                        }
                   } }/>
        </Fragment>
    );

}

function MenuOption(props: MenuOptionProps) {
    let value = props.value;
    let deleteVariableOption = useSetAtom(deleteVariableOptionAtom);

    if (isInsertOption(value)) {
        return <EditInsertedOption options = {props.options}/>;
    }    
    else
        return (        
            <Fragment>
                <div className = "drag-handle" style={{display: "inline-block", verticalAlign: "middle"}}><Holder /></div>
                <div style={{display: "inline-block", marginLeft: 5}}> { value } </div>
                <a style={{float: "right"}} onClick={ () => deleteVariableOption(value) }><DeleteRedIcon /></a>   
            </Fragment>        
        );
}

function BodySettings() {
    let [gridWidth, setGridWidth] = useState(350);
    let [templateSource] = useAtom(templateSourceAtom);
    let [selectedVariable, setSelectedVariable] = useAtom(selectedVariableAtom);
    let template = lex(templateSource);
    let variables = extractVariables(template);

    let setVariableAttribute = useSetAtom(setVariableAttributeAtom);
    let variableAttributes = useAtomValue(selectedVariableAttributesAtom);

    let options = variableAttributes["options"] || [];

    return (
        <div style = {{display: "flex", gap: "2%", height: "100%"}}>
            <div style = {{width: "32%", display: "flex", flexDirection: "column"}}>
                <div className="title">Variabler:</div>
                <List items = { variables }
                      selected = { selectedVariable }
                      style = {{border: "1px solid #DFDFDF", borderRadius: 7, flexGrow: 1, height: 0, overflowY: "auto"}}
                      onClick = { (k) => setSelectedVariable(k) }  />
            </div>   
            <div style = {{width: "32%"}}>
                <div className = "title">Indstilling af varibel:</div>
                <SelectedVariableAttributesContainer/>
            </div>

            {recordToPvAttr(variableAttributes).getComponent() === "menu" ?
                <div style={{width: "32%", display: "flex", flexDirection: "column"}}>
                    <div className="title">Menu indstillinger:</div>
                    <div style={{border: "1px solid #DFDFDF", borderRadius: 7, padding: 10, flexGrow: 1, height: 0, overflowY: "auto"}}>
                        <ReactGrid
                            cols = { 1 }
                            width = { gridWidth }
                            rowHeight = { 31 }
                            isBounded = { true }
                            isResizable = { false }
                            margin = {[0, 0]}
                            draggableHandle ={ ".react-grid-layout .drag-handle" }
                            innerRef = { (el) => { if ( el ) { setGridWidth(el.getBoundingClientRect().width) }} }
                            layout =  {  [...options.map( (row: any, i: number) => { return {i: row, x: 0, y: i, w: 1, h: 1}; } ), 
                                        {i: insertOption.toString(), x: 0, y: options.length, w: 1, h: 1, static: true}] }
                            onLayoutChange = { ( layout: Layout[] ) => {
                                                let res = layout
                                                                .sort( (a, b) => a.y - b.y)
                                                                .reduce( (acc: any[], el) => { if (!isInsertOption(el.i)) acc.push(el.i); return acc;}, []);
                                                setVariableAttribute("options", res);
                                                } }>
                                {[...options, insertOption].map( (v: any) => 
                                    <div key = { v.toString() } style={{lineHeight: "31px", userSelect: "none"}}>
                                        <MenuOption value = { v } options = {options}/>
                                    </div> 
                                )}
                        </ReactGrid>
                    </div>
                </div>
                : null
            }
        </div>
    );
}


function Body() {
    let activeTab = useAtomValue(activeTabAtom);
    return (
        <div className="modal-body">
            {((activeTab: number): any => {
                switch(true) {
                    case (activeTab === 0): return <BodySource/>
                    case (activeTab === 1): return <BodySettings />
                }
            })(activeTab)}
        </div>
    );
}

type TemplateBuilderProps = {
    onSubmit: Function;
}

function Footer(props: TemplateBuilderProps) {
    let setModalOpen = useSetAtom(setModalOpenAtom);
    let template = useAtomValue(getTemplateAtom);
    return (
        <div className="modal-footer" style={{textAlign: "right"}}>
            <a  className="button"
                style={{padding: "7px 21px", fontWeight: "bold"}}
                onClick={ () => { props.onSubmit(template); setModalOpen(false) } }>
                Gem
            </a>
        </div>
    );
}

export function TemplateBuilder(props: TemplateBuilderProps) {
    let modalOpen = useAtomValue(modalOpenAtom);
    
    let setModalOpen = useSetAtom(setModalOpenAtom);
    let modalStyle:any = {overlay: {background: "rgba(0,0,0, 0.7)"},
                          content: {width: "80%", margin: "auto auto", padding: 0}};
    return (
        <Modal isOpen={modalOpen}
               closeTimeoutMS={200}
               style={modalStyle}
               onRequestClose={() => setModalOpen(false)}>
            <div className="modal template-builder">
                <Header/>
                <Body/>
                <Footer onSubmit = { props.onSubmit }/>
            </div>
        </Modal>
    );
}