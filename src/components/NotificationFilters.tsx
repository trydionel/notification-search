import React, { useRef } from 'react';
import { SearchIcon, SyncIcon, SunIcon } from 'https://cdn.skypack.dev/@primer/octicons-react';

export const NotificationFilters = ({ isLoading, projects, onSearch, onRefresh }) => {
  const queryRef = useRef();
  const projectRef = useRef();

  const onChange = () => {
    onSearch({
      query: queryRef.current?.value,
      project: projectRef.current?.value || null
    })
  }

  return (
    <div className="field is-grouped mb-6">
      <div className="control is-expanded has-icons-left">
        <input ref={queryRef} className="input" type="search" placeholder="Search notifications..." onChange={onChange} />
        <span className="icon is-small is-left">
          <SearchIcon />
        </span>
      </div>

      <div className="control">
        <div className="select">
          <select ref={projectRef} onChange={onChange}>
            <option value="">All projects</option>
            { Object.keys(projects).map(projectId => { 
              return <option value={projectId}>{projects[projectId]}</option>
             })}
          </select>
        </div>
      </div>

      <div className="control">
        {
          isLoading ? (
            <span className="icon is-small">
              <SunIcon />
            </span>
          ) : (
            <button className="button is-ghost" onClick={e => onRefresh()}>
              <span className="icon is-small">
                <SyncIcon />
              </span>
            </button>
          )
        }
      </div>
    </div>
  )
}