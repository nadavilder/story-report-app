import BlogList from "./BlogList";
import useFeatch from "./useFetch";

const Home = () => {
  const {
    data: blogs,
    isPending,
    error,
  } = useFeatch("http://localhost:8000/blogs");
  return (
    <div className="home">
      {error && <div>{error}</div>}
      {isPending && <div> Loading...</div>}
      {!isPending && blogs && <BlogList blogs={blogs} title="All Blogs" />}
    </div>
  );
};

export default Home;
