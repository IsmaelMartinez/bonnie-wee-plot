# Task List: Vegetable Garden Planner Implementation

## Project Overview

The Vegetable Garden Planner is a comprehensive planning tool that allows Community Allotment app users to create, organize, and manage their vegetable garden plans. This feature addresses the common challenges allotment gardeners face: difficulty tracking what vegetables to plant when, lack of organization in garden planning, and not knowing which vegetables work well together.

## Implementation Tasks

### Phase 1: Foundation & Data Setup
- [ ] **T1: Create vegetable database structure**
  - [ ] T1.1: Define vegetable data schema (name, category, planting info, care requirements)
  - [ ] T1.2: Create comprehensive vegetable dataset with common allotment vegetables
  - [ ] T1.3: Organize vegetables by categories (leafy greens, root vegetables, brassicas, legumes, solanaceae, herbs)
  - [ ] T1.4: Add planting date recommendations and growing characteristics
  - [ ] T1.5: Include harvest timing and basic care requirements for each vegetable

- [ ] **T2: Setup core data structures and types**
  - [ ] T2.1: Create TypeScript interfaces for garden plans, vegetables, and plot assignments
  - [ ] T2.2: Define data validation schemas
  - [ ] T2.3: Implement local storage wrapper with error handling
  - [ ] T2.4: Create data migration utilities for future updates

### Phase 2: Core Planning Features
- [ ] **T3: Implement garden plan creation**
  - [ ] T3.1: Create garden plan creation form with name and description
  - [ ] T3.2: Implement plan storage in local browser storage
  - [ ] T3.3: Add auto-save functionality for plan changes
  - [ ] T3.4: Create plan listing/management interface

- [ ] **T4: Build vegetable selection system**
  - [ ] T4.1: Create searchable vegetable selector component
  - [ ] T4.2: Implement filtering by category, planting season, and characteristics
  - [ ] T4.3: Add custom vegetable creation functionality
  - [ ] T4.4: Build vegetable addition to plan with quantities

### Phase 3: Plot Organization
- [ ] **T5: Implement garden sections/plots**
  - [ ] T5.1: Create plot/section creation interface
  - [ ] T5.2: Allow assignment of vegetables to specific sections
  - [ ] T5.3: Build visual grid representation of garden plots
  - [ ] T5.4: Implement drag-and-drop for vegetable assignment

### Phase 4: Timeline & Scheduling
- [ ] **T6: Add planting date management**
  - [ ] T6.1: Implement automatic planting date recommendations
  - [ ] T6.2: Allow custom planting date setting
  - [ ] T6.3: Add location-based planting window suggestions
  - [ ] T6.4: Create planting schedule validation

- [ ] **T7: Build calendar integration**
  - [ ] T7.1: Create calendar view for planting schedules
  - [ ] T7.2: Integrate with existing calendar components
  - [ ] T7.3: Add planting reminder creation
  - [ ] T7.4: Display optimal planting windows on calendar

### Phase 5: Visualization & Views
- [ ] **T8: Implement multiple view modes**
  - [ ] T8.1: Create list view showing all planned vegetables
  - [ ] T8.2: Build visual plot layout display
  - [ ] T8.3: Integrate calendar view for scheduling
  - [ ] T8.4: Add seamless switching between view modes

### Phase 6: Data Management
- [ ] **T9: Add export/import functionality**
  - [ ] T9.1: Implement plan export to JSON files
  - [ ] T9.2: Create plan import from JSON functionality
  - [ ] T9.3: Add data validation for imported plans
  - [ ] T9.4: Handle import error cases gracefully

### Phase 7: Integration Features
- [ ] **T10: Integrate with Aitor AI**
  - [ ] T10.1: Add direct links to ask Aitor about specific vegetables
  - [ ] T10.2: Extend Aitor's knowledge base with garden planning expertise
  - [ ] T10.3: Create plan-specific query generation
  - [ ] T10.4: Add quick Aitor access from planning interface

- [ ] **T11: Connect with existing app features**
  - [ ] T11.1: Link to announcements for relevant delivery notifications
  - [ ] T11.2: Add quick access to Companion Planting section
  - [ ] T11.3: Connect to Composting section from planning interface
  - [ ] T11.4: Update main navigation to include garden planning

### Phase 8: User Experience Enhancements
- [ ] **T12: Add guidance and tooltips**
  - [ ] T12.1: Create helpful tooltips for beginners
  - [ ] T12.2: Add progress indicator for planning completion
  - [ ] T12.3: Display harvest time estimates
  - [ ] T12.4: Show care requirements for each vegetable

### Phase 9: Testing & Polish
- [ ] **T13: Implement comprehensive testing**
  - [ ] T13.1: Add unit tests for data management functions
  - [ ] T13.2: Create component tests for major features
  - [ ] T13.3: Add integration tests for planning workflow
  - [ ] T13.4: Test responsive design across devices

- [ ] **T14: Performance optimization**
  - [ ] T14.1: Implement lazy loading for vegetable database
  - [ ] T14.2: Optimize search and filtering algorithms
  - [ ] T14.3: Add caching for vegetable data and plans
  - [ ] T14.4: Test and optimize loading states

### Phase 10: Accessibility & Final Testing
- [ ] **T15: Ensure accessibility compliance**
  - [ ] T15.1: Add proper ARIA labels throughout interface
  - [ ] T15.2: Implement keyboard navigation support
  - [ ] T15.3: Test with screen readers
  - [ ] T15.4: Verify color contrast and visual accessibility

- [ ] **T16: Final integration and testing**
  - [ ] T16.1: Run full Playwright test suite
  - [ ] T16.2: Test all user flows end-to-end
  - [ ] T16.3: Verify mobile responsiveness
  - [ ] T16.4: Final UI/UX polish and bug fixes

## User Stories Reference

### Primary User Stories
- **As a beginner gardener**, I want to create a list of vegetables I plan to grow this season so that I can organize my allotment and get guidance on when to plant each crop.
- **As an experienced gardener**, I want to organize my vegetables by garden sections/plots so that I can efficiently manage multiple growing areas.
- **As any gardener**, I want to see when to plant each vegetable in my plan so that I can schedule my gardening activities appropriately.
- **As a planning-focused gardener**, I want to get personalized advice from Aitor about my planned vegetables so that I can optimize my garden's success.

### Secondary User Stories
- **As a mobile user**, I want to access my garden plan on my phone while at the allotment so that I can reference what I planned to plant in each area.
- **As a seasonal planner**, I want to plan multiple seasons ahead so that I can prepare for year-round gardening.
- **As a data-conscious gardener**, I want my plans to be automatically saved so that I don't lose my planning work.

## Functional Requirements Mapping

### Core Planning Features (T3-T4)
1. **The system must allow users to create a new garden plan with a custom name and description.** *(T3.1)*
2. **The system must provide a comprehensive list of common allotment vegetables organized by categories (leafy greens, root vegetables, brassicas, legumes, solanaceae, herbs, etc.).** *(T1.2-T1.3)*
3. **The system must allow users to search and filter vegetables by name, category, planting season, and growing characteristics.** *(T4.1-T4.2)*
4. **The system must enable users to add custom vegetables not included in the pre-defined list.** *(T4.3)*
5. **The system must allow users to add selected vegetables to their garden plan with planned quantities.** *(T4.4)*

### Plot Organization Features (T5)
6. **The system must allow users to create multiple garden sections/plots within their plan (e.g., "North Plot", "Greenhouse", "Container Garden").** *(T5.1)*
7. **The system must enable users to assign vegetables to specific garden sections.** *(T5.2)*
8. **The system must display a visual grid representation of garden plots with assigned vegetables.** *(T5.3)*

### Timeline and Scheduling (T6-T7)
9. **The system must provide planting date recommendations for each vegetable based on local growing seasons.** *(T6.1)*
10. **The system must allow users to set custom planting dates for their vegetables.** *(T6.2)*
11. **The system must display a calendar view showing when to plant each vegetable in the plan.** *(T7.1)*
12. **The system must automatically suggest optimal planting windows based on current date and location (if available).** *(T6.3)*

### Visualization Options (T8)
13. **The system must provide a list view showing all planned vegetables with planting dates and locations.** *(T8.1)*
14. **The system must offer a visual plot layout showing the spatial organization of vegetables.** *(T8.2)*
15. **The system must include a calendar view displaying planting schedules over time.** *(T8.3)*
16. **The system must allow users to switch between visualization modes seamlessly.** *(T8.4)*

### Data Management (T2, T9)
17. **The system must save garden plans to local browser storage for immediate access.** *(T3.2)*
18. **The system must provide export functionality to download plans as JSON files.** *(T9.1)*
19. **The system must allow users to import previously exported garden plans.** *(T9.2)*
20. **The system must auto-save changes as users modify their plans.** *(T3.3)*

### Integration Features (T10-T11)
21. **The system must provide direct links to ask Aitor about specific vegetables in the plan.** *(T10.1)*
22. **The system must integrate with the calendar feature to create planting reminders.** *(T7.3)*
23. **The system must connect to the announcements system to highlight relevant delivery notifications (bark, plants, etc.).** *(T11.1)*
24. **The system must include quick access to relevant sections (Companion Planting, Composting) from the planning interface.** *(T11.2-T11.3)*

### User Experience (T12)
25. **The system must provide helpful tooltips and guidance for beginners throughout the planning process.** *(T12.1)*
26. **The system must display estimated harvest times for each planned vegetable.** *(T12.3)*
27. **The system must show basic care requirements (sun, water, spacing) for each vegetable.** *(T12.4)*
28. **The system must provide a progress indicator showing planning completion status.** *(T12.2)*

## Non-Goals (Out of Scope)

- **Crop Rotation Logic**: Advanced crop rotation recommendations will be addressed in a future iteration
- **Companion Planting Integration**: Automatic companion planting suggestions will be added later
- **Weather Integration**: Real-time weather data and alerts are not included in this version
- **Social Features**: Sharing plans with other community members is out of scope
- **E-commerce Integration**: Direct purchasing of seeds/plants through the app is not included
- **Mobile App**: This is a web-based feature; native mobile apps are not in scope
- **User Authentication**: Plans will be stored locally; user accounts are not required for this version
- **Advanced Garden Analytics**: Yield tracking, success metrics, and garden performance analysis are future features

## Technical Considerations

### Data Structure
- **Garden Plans**: Store as JSON objects with plan metadata, vegetables list, and plot assignments *(T2.1)*
- **Vegetable Database**: Create comprehensive vegetable data with planting information, care requirements, and categories *(T1.1-T1.4)*
- **Local Storage**: Implement robust local storage with data validation and migration support *(T2.3-T2.4)*

### Performance Requirements
- **Lazy Loading**: Load vegetable database and images on demand *(T14.1)*
- **Search Optimization**: Implement efficient filtering and search algorithms *(T14.2)*
- **Caching**: Cache vegetable data and user plans for fast access *(T14.3)*

### Integration Points
- **Aitor AI**: Extend existing AI advisor API to handle plan-specific queries *(T10.2-T10.3)*
- **Calendar**: Connect to existing calendar components for reminder creation *(T7.2)*
- **Navigation**: Add new navigation items for garden planning section *(T11.4)*

## Success Metrics

### Primary Metrics
- **Adoption Rate**: 40% of app users create at least one garden plan within 30 days of feature launch
- **Engagement**: Users with garden plans visit the app 2x more frequently than users without plans
- **Plan Completion**: 70% of created plans include at least 5 vegetables with planting dates
- **AI Integration**: 30% of plan creators ask Aitor questions about their planned vegetables

### Secondary Metrics
- **Feature Usage**: Users utilize at least 2 of the 3 visualization modes (list, plot, calendar)
- **Plan Persistence**: 80% of users return to modify their plans within 2 weeks of creation
- **Export Usage**: 15% of users export their plans for offline reference
- **Mobile Usage**: 40% of plan interactions occur on mobile devices

## Relevant Files

*This section will be updated as implementation progresses:*

- `/src/app/garden-planner/` - Main garden planner directory (to be created)
- `/src/components/garden-planner/` - Planner components (to be created)
- `/src/lib/vegetable-database.ts` - Vegetable data and types (to be created)
- `/src/lib/garden-storage.ts` - Local storage utilities (to be created)
- `/src/types/garden-planner.ts` - TypeScript interfaces (to be created)

## Implementation Guidelines

1. **One sub-task at a time**: Do NOT start the next sub-task until you ask the user for permission and they say "yes" or "y"
2. **Mark completed tasks**: Change `[ ]` to `[x]` when subtasks are completed
3. **Test before committing**: Run full test suite before marking parent tasks complete
4. **Clean commits**: Use conventional commit format with descriptive messages
5. **Update this file**: Keep task status and "Relevant Files" section current

---

**Document Version**: 2.0 (Task List Format)  
**Created**: June 25, 2025  
**Last Updated**: June 25, 2025  
**Target Implementation**: Q3 2025  
**Next Task**: T1.1 - Define vegetable data schema
