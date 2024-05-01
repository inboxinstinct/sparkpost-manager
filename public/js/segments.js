document.addEventListener('DOMContentLoaded', () => {
  const segmentsTable = document.getElementById('segmentsTable');
  const createSegmentBtn = document.getElementById('createSegmentBtn');

  // Fetch segments from the server and populate the table
// Fetch segments from the server and populate the table
async function fetchSegments() {
  try {
    const response = await fetch('/segments');
    const segments = await response.json();
    if (segmentsTable) {
      // Sort segments based on the last updated date (descending order)
      //segments.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
      populateSegmentsTable(segments);
    }
  } catch (error) {
    console.error('Failed to fetch segments:', error);
  }
}


  // Populate the segments table with data
  function populateSegmentsTable(segments) {
    const tbody = segmentsTable.querySelector('tbody');
    tbody.innerHTML = '';
  
    segments.forEach(segment => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding-left:24px;">${segment.name}</td>
        <td>${segment.totalCount}</td>
        <td>${new Date(segment.lastUpdated).toLocaleString()}</td>
        <td>
          <button class="editBtn" data-id="${segment._id}">Edit</button>
          <button class="refreshBtn" data-id="${segment._id}">Refresh</button>
          <button class="exportBtn" data-id="${segment._id}">Export</button>
          <button class="deleteBtn" data-id="${segment._id}">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Event listener for the create segment button
  if (createSegmentBtn) {
    createSegmentBtn.addEventListener('click', () => {
      // Redirect to the segment builder page
      window.location.href = '/segment-builder';
    });
  }

 // Event listeners for edit, refresh, export, and delete buttons
 if (segmentsTable) {
  segmentsTable.addEventListener('click', async (event) => {
    if (event.target.classList.contains('editBtn')) {
      const segmentId = event.target.dataset.id;
      // Redirect to the segment builder page with the segment ID
      window.location.href = `/segment-builder?segmentId=${segmentId}`;
    } else if (event.target.classList.contains('refreshBtn')) {
      const segmentId = event.target.dataset.id;
      const row = event.target.closest('tr');
      await refreshSegment(segmentId, row);
      //const segmentId = event.target.dataset.id;
      // Refresh the segment data and update the table
      //await refreshSegment(segmentId);
      //fetchSegments();
    } else if (event.target.classList.contains('exportBtn')) {
      const segmentId = event.target.dataset.id;
      // Export the segment data as a CSV file
      exportSegment(segmentId);
    } else if (event.target.classList.contains('deleteBtn')) {
      const segmentId = event.target.dataset.id;
      // Confirm the deletion
      const confirmDelete = confirm('Are you sure you want to delete this segment?');
      if (confirmDelete) {
        try {
          const response = await fetch(`/segments/${segmentId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            // Segment deleted successfully, refresh the segments table
            fetchSegments();
          } else {
            console.error('Failed to delete segment');
          }
        } catch (error) {
          console.error('Error deleting segment:', error);
        }
      }
    }
  });
}


  // Refresh a segment by updating its total count and last updated time
 /* async function refreshSegment(segmentId) {
    try {
      const response = await fetch(`/segments/${segmentId}/refresh`, {
        method: 'PUT',
      });
      const updatedSegment = await response.json();
      console.log('Segment refreshed:', updatedSegment);
    } catch (error) {
      console.error('Failed to refresh segment:', error);
    }
  } */

  async function refreshSegment(segmentId, row) {
    try {
      console.log('Refresh button clicked for segment:', segmentId);
      const refreshBtn = row.querySelector('.refreshBtn');
      const countCell = row.querySelector('td:nth-child(2)');
      const lastUpdatedCell = row.querySelector('td:nth-child(3)');
      const originalContent = refreshBtn.innerHTML;
  
      refreshBtn.innerHTML = '<div class="loading-wheel"></div>';
      refreshBtn.disabled = true;
  
      const response = await fetch(`/segments/${segmentId}/refresh`, {
        method: 'PUT',
      });
  
      console.log('Response received:', response);
  
      if (response.ok) {
        const updatedSegment = await response.json();
        console.log('Updated segment data:', updatedSegment);
        countCell.textContent = updatedSegment.totalCount;
        lastUpdatedCell.textContent = new Date(updatedSegment.lastUpdated).toLocaleString();
      } else {
        console.error('Failed to refresh segment');
      }
  
      refreshBtn.innerHTML = originalContent;
      refreshBtn.disabled = false;
    } catch (error) {
      console.error('Failed to refresh segment:', error);
      refreshBtn.innerHTML = originalContent;
      refreshBtn.disabled = false;
    }
  }
  
  
  
  
  

  

  // Export a segment as a CSV file
  async function exportSegment(segmentId) {
    try {
      const response = await fetch(`/segments/${segmentId}/export`);
      if (response.ok) {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'segment.csv';
        link.click();
      } else {
        console.error('Failed to export segment');
      }
    } catch (error) {
      console.error('Failed to export segment:', error);
    }
  }
    

  // Function to populate the segment form with data
  function populateSegmentForm(segment) {
    const segmentNameInput = document.getElementById('name');
    const criteriaContainer = document.getElementById('criteriaContainer');
  
    // Set the segment name
    segmentNameInput.value = segment.name;
  
    // Clear existing criteria
    criteriaContainer.innerHTML = '';
    segmentIdInput.value = segment._id;
  
    // Populate the criteria fields
    segment.criteria.forEach((criterion) => {
      const criteriaDiv = document.createElement('div');
      criteriaDiv.className = 'criteria';
      criteriaDiv.innerHTML = `
        <select name="operator">
          <option value="and" ${criterion.operator === 'and' ? 'selected' : ''}>AND</option>
          <option value="or" ${criterion.operator === 'or' ? 'selected' : ''}>OR</option>
        </select>
        <select name="field">
          <option value="hasOpened" ${criterion.field === 'hasOpened' ? 'selected' : ''}>Has Opened</option>
          <option value="hasNotOpened" ${criterion.field === 'hasNotOpened' ? 'selected' : ''}>Has Not Opened</option>
          <!-- Add more field options -->
        </select>
        <input type="number" name="value" min="1" value="${criterion.value}" required>
        <select name="timeframe">
          <option value="campaigns" ${criterion.timeframe === 'campaigns' ? 'selected' : ''}>Campaigns</option>
          <!-- Add more timeframe options -->
        </select>
      `;
      criteriaContainer.appendChild(criteriaDiv);
    });
  }

  // Check if the current page is the segment builder page
  if (window.location.pathname === '/segment-builder') {
    const segmentBuilderForm = document.getElementById('segmentBuilderForm');

    // Event listener for the add criteria button
    const addCriteriaBtn = document.getElementById('addCriteriaBtn');
    if (addCriteriaBtn) {
      addCriteriaBtn.addEventListener('click', () => {
        const criteriaContainer = document.getElementById('criteriaContainer');
        const newCriteria = document.createElement('div');
        newCriteria.className = 'criteria';
        newCriteria.innerHTML = `
          <select name="operator">
            <option value="and">AND</option>
            <option value="or">OR</option>
          </select>
          <select name="field">
            <option value="hasOpened">Has Opened</option>
            <option value="hasNotOpened">Has Not Opened</option>
            <option value="hasClicked">Has Clicked</option>
            <option value="hasNotClicked">Has Not Clicked</option>
            <option value="hasDelivered">Has Delivered</option>
            <option value="hasNotDelivered">Has Not Delivered</option>
            <option value="hasUnsubscribed">Has Unsubscribed</option>
            <option value="hasNotUnsubscribed">Has Not Unsubscribed</option>
            <option value="hasBounced">Has Bounced</option>
            <option value="hasNotBounced">Has Not Bounced</option>
          </select>
          <input type="number" name="value" min="1" required>
          <select name="timeframe">
            <option value="campaigns">Campaigns</option>
            <!-- Add more timeframe options -->
          </select>
        `;
        criteriaContainer.appendChild(newCriteria);
      });
    }

    // Event listener for the segment builder form submission
    // Event listener for the segment builder form submission
// Event listener for the segment builder form submission
if (segmentBuilderForm) {
  segmentBuilderForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(segmentBuilderForm);
    const segmentId = formData.get('_id');
    const segmentData = {
      name: formData.get('name'),
      criteria: [],
    };

    const criteriaElements = segmentBuilderForm.querySelectorAll('.criteria');
    criteriaElements.forEach((criteriaElement) => {
      const operator = criteriaElement.querySelector('select[name="operator"]').value;
      const field = criteriaElement.querySelector('select[name="field"]').value;
      const value = parseInt(criteriaElement.querySelector('input[name="value"]').value);
      const timeframe = criteriaElement.querySelector('select[name="timeframe"]').value;

      segmentData.criteria.push({
        operator,
        field,
        value,
        timeframe,
      });
    });

    try {
      let response;

      if (segmentId) {
        // Update existing segment
        response = await fetch(`/segments/${segmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(segmentData),
        });
      } else {
        // Create new segment
        response = await fetch('/segments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(segmentData),
        });
      }

      if (response.ok) {
        // Segment saved successfully, redirect to segments page
        window.location.href = '/segments.html';
        fetchSegments();

      } else {
        // Handle error
        console.error('Failed to save segment');
      }
    } catch (error) {
      console.error('Failed to save segment:', error);
    }
  });
}


  }

  // Fetch segments when the page loads
  fetchSegments();
});
