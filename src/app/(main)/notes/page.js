'use client';

import { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { UserContext } from "@/src/app/components/additionals/userContext";
import ProtectedRoute from "@/src/app/components/additionals/protectedRoute";

function ResourceLibraryContent() {
  const { isAuthenticated, loading } = useContext(UserContext);
  const router = useRouter();
  const [verified, setVerified] = useState(true);
  
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResources: 0,
    limit: 9
  });
  
  // Image height adjustable in code (not through UI)
  const imageHeight = 570; // Change this value to adjust image height in pixels

  // Fetch resources
  const fetchResources = async (name = "", category = "", page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      let url = `/api/resources?page=${page}&limit=${pagination.limit}`;
      if (name) url += `&name=${encodeURIComponent(name)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (res.ok) {
        setResources(data.resources || data);
        setPagination(prev => ({
          ...prev,
          totalPages: data.totalPages || 1,
          totalResources: data.totalResources || (data.resources ? data.resources.length : data.length),
          currentPage: page,
        }));
      } else {
        setError(data.error || "Failed to fetch resources");
      }
    } catch (err) {
      setError("Error fetching resources");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchResources(searchName, selectedCategory, 1);
  };

  // Handle category filter
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    fetchResources(searchName, e.target.value, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchResources(searchName, selectedCategory, newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Initial fetch
  useEffect(() => {
    if (verified) {
      fetchResources();
    }
  }, [verified]);

  // Categories from your schema
  const categories = [
    'Basic Computer', 
    'MS Word', 
    'AutoCAD', 
    'Programming', 
    'Web Designing', 
    'Graphic Designing', 
    'Animation', 
    'Computer Accountancy',
    'Other'
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Show loading spinner while authenticating
  if (loading || !verified) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#e3f1f1]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      <Head>
        <title>Resource Library</title>
        <meta name="description" content="Browse our collection of resources" />
      </Head>

      <header className=" text-blue-600">
        <div className="container mx-auto px-4 py-12 pb-0 text-center">
               <motion.h1 
        className="text-center text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Resources Available
      </motion.h1>
      
          <motion.p 
            className="text-xl opacity-90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Discover our curated collection of learning resources
          </motion.p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <motion.div 
          className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search by name
              </label>
              <input
                type="text"
                id="search"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter course name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="w-full md:w-64">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-auto">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                Search
              </button>
            </div>
          </form>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <motion.div 
              className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div 
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {/* Results Count */}
        {!isLoading && !error && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-gray-600 font-medium">
              Showing {resources.length} of {pagination.totalResources} resources
            </p>
          </motion.div>
        )}

        {/* Resources Grid */}
        {!isLoading && !error && resources.length > 0 && (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {resources.map((resource) => (
              <motion.div 
                key={resource.id} 
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-100"
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                {/* Cover Photo */}
                <div 
                  className="w-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden"
                  style={{ height: `${imageHeight}px` }}
                >
                  {resource.coverPhotoUrl ? (
                    <img 
                      src={resource.coverPhotoUrl} 
                      alt={resource.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="text-blue-400">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Resource Info */}
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
                    {resource.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {resource.description || 'No description available'}
                  </p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                      {resource.category}
                    </span>
                    
                    <div className="flex space-x-3">
                      {resource.pdfUrl && (
                        <a 
                          href={resource.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors transform hover:scale-110"
                          title="Download PDF"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                      
                      {resource.pdfLink && (
                        <a 
                          href={resource.pdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors transform hover:scale-110"
                          title="View Online"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {resource.publishedDate && (
                    <p className="text-sm text-gray-500">
                      Published: {new Date(resource.publishedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No Results */}
        {!isLoading && !error && resources.length === 0 && (
          <motion.div 
            className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xl font-medium text-gray-700 mb-2">No resources found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </motion.div>
        )}

        {/* Pagination */}
        {!isLoading && !error && pagination.totalPages > 1 && (
          <motion.div 
            className="flex justify-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
              >
                Previous
              </button>
              
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-2 rounded-lg ${
                    pagination.currentPage === i + 1
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  } transition-colors`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
              >
                Next
              </button>
            </nav>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default function ResourceLibrary() {
  return (
    <ProtectedRoute>
      <ResourceLibraryContent />
    </ProtectedRoute>
  );
}